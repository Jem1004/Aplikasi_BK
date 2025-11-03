# Encryption Key Rotation Guide

## Overview

This guide describes the procedure for rotating the `DATABASE_ENCRYPTION_KEY` used to encrypt counseling journal data in the database.

## When to Rotate Keys

Key rotation should be performed:
- **Regularly**: Every 6-12 months as a security best practice
- **After a security incident**: If there's any suspicion of key compromise
- **When personnel changes**: If staff with key access leave the organization
- **Compliance requirements**: As mandated by your security policies

## Current Encryption Implementation

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes, represented as 64 hexadecimal characters)
- **IV**: Randomly generated per record (16 bytes)
- **Authentication Tag**: 16 bytes for data integrity verification

## Key Rotation Procedure

### Phase 1: Preparation

1. **Generate New Key**
   ```bash
   # Generate a new 256-bit key (64 hex characters)
   openssl rand -hex 32
   ```

2. **Backup Database**
   ```bash
   # Create a full database backup before rotation
   pg_dump -U bk_user -d aplikasi_bk > backup_before_rotation_$(date +%Y%m%d).sql
   ```

3. **Schedule Maintenance Window**
   - Notify users of scheduled maintenance
   - Plan for minimal downtime (estimated: 5-30 minutes depending on data volume)

### Phase 2: Key Rotation Script

Create a migration script to re-encrypt all counseling journals:

```typescript
// scripts/rotate-encryption-key.ts
import { PrismaClient } from '@prisma/client';
import { decrypt as oldDecrypt } from '@/lib/encryption/crypto';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Old key (current)
const OLD_KEY = Buffer.from(process.env.DATABASE_ENCRYPTION_KEY!, 'hex');

// New key (from command line argument or env var)
const NEW_KEY = Buffer.from(process.env.NEW_DATABASE_ENCRYPTION_KEY!, 'hex');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function encryptWithNewKey(text: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, NEW_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

async function rotateKeys() {
  console.log('Starting key rotation...');
  
  // Get all counseling journals
  const journals = await prisma.counselingJournal.findMany({
    where: {
      deletedAt: null
    }
  });
  
  console.log(`Found ${journals.length} journals to re-encrypt`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const journal of journals) {
    try {
      // Decrypt with old key
      const decryptedContent = oldDecrypt(
        journal.encryptedContent,
        journal.encryptionIv,
        journal.encryptionTag
      );
      
      // Re-encrypt with new key
      const { encrypted, iv, tag } = encryptWithNewKey(decryptedContent);
      
      // Update database
      await prisma.counselingJournal.update({
        where: { id: journal.id },
        data: {
          encryptedContent: encrypted,
          encryptionIv: iv,
          encryptionTag: tag
        }
      });
      
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`Progress: ${successCount}/${journals.length}`);
      }
    } catch (error) {
      console.error(`Failed to rotate key for journal ${journal.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\nKey rotation complete!`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    throw new Error('Key rotation completed with errors. Please review logs.');
  }
}

rotateKeys()
  .then(() => {
    console.log('Key rotation successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Key rotation failed:', error);
    process.exit(1);
  });
```

### Phase 3: Execute Rotation

1. **Set Environment Variables**
   ```bash
   # Keep old key in DATABASE_ENCRYPTION_KEY
   export DATABASE_ENCRYPTION_KEY="old_key_here"
   
   # Set new key in NEW_DATABASE_ENCRYPTION_KEY
   export NEW_DATABASE_ENCRYPTION_KEY="new_key_here"
   ```

2. **Run Rotation Script**
   ```bash
   # Execute the rotation
   tsx scripts/rotate-encryption-key.ts
   ```

3. **Verify Success**
   - Check that all journals were re-encrypted successfully
   - Verify no errors in the output

4. **Update Environment Variables**
   ```bash
   # Update .env.local (development)
   DATABASE_ENCRYPTION_KEY="new_key_here"
   
   # Update production environment variables
   # (via hosting platform dashboard or CLI)
   ```

5. **Restart Application**
   ```bash
   # Development
   npm run dev
   
   # Production
   # Restart via hosting platform
   ```

### Phase 4: Verification

1. **Test Decryption**
   - Log in as a Guru BK user
   - Open existing counseling journals
   - Verify content displays correctly

2. **Test Encryption**
   - Create a new counseling journal
   - Verify it saves successfully
   - Verify it can be read back

3. **Database Verification**
   ```sql
   -- Check that all journals have been updated
   SELECT COUNT(*) FROM counseling_journals 
   WHERE deleted_at IS NULL;
   
   -- Verify encryption fields are populated
   SELECT COUNT(*) FROM counseling_journals 
   WHERE encrypted_content IS NOT NULL 
   AND encryption_iv IS NOT NULL 
   AND encryption_tag IS NOT NULL;
   ```

### Phase 5: Cleanup

1. **Secure Old Key**
   - Store old key in secure vault for recovery purposes
   - Keep for at least 30 days in case rollback is needed

2. **Update Documentation**
   - Document the rotation date
   - Update key version tracking

3. **Monitor Application**
   - Watch for any decryption errors in logs
   - Monitor user reports for issues

## Rollback Procedure

If issues are discovered after rotation:

1. **Stop Application**
2. **Restore Database Backup**
   ```bash
   psql -U bk_user -d aplikasi_bk < backup_before_rotation_YYYYMMDD.sql
   ```
3. **Revert Environment Variables**
   ```bash
   DATABASE_ENCRYPTION_KEY="old_key_here"
   ```
4. **Restart Application**
5. **Investigate Issues**

## Security Best Practices

1. **Key Storage**
   - Never commit keys to version control
   - Use secure secret management (e.g., AWS Secrets Manager, HashiCorp Vault)
   - Limit access to keys to essential personnel only

2. **Key Generation**
   - Always use cryptographically secure random number generators
   - Use the recommended `openssl rand -hex 32` command
   - Never use predictable or weak keys

3. **Access Control**
   - Implement strict access controls for key management
   - Audit all key access and rotation activities
   - Use multi-person authorization for key changes

4. **Monitoring**
   - Log all encryption/decryption operations
   - Monitor for unusual patterns or failures
   - Set up alerts for decryption failures

## Troubleshooting

### Issue: Decryption Fails After Rotation

**Cause**: Application still using old key or rotation incomplete

**Solution**:
1. Verify `DATABASE_ENCRYPTION_KEY` is updated in all environments
2. Check rotation script completed successfully
3. Verify application restarted after key update

### Issue: Some Journals Cannot Be Decrypted

**Cause**: Partial rotation or corruption

**Solution**:
1. Restore from backup
2. Re-run rotation script
3. Investigate specific journal IDs that failed

### Issue: Performance Degradation During Rotation

**Cause**: Large number of journals being re-encrypted

**Solution**:
1. Process journals in batches
2. Add delays between batches
3. Schedule during low-traffic periods

## Contact

For questions or issues with key rotation:
- Security Team: security@school.com
- System Administrator: admin@school.com

## Version History

- v1.0 (2024-11-03): Initial key rotation guide
