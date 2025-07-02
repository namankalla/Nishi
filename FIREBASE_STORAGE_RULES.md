# Firebase Storage Rules for Journal App

To fix upload issues, you need to configure Firebase Storage rules properly. Here's how to set them up:

## 1. Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`nishi-b0003`)
3. Go to **Storage** in the left sidebar
4. Click on **Rules** tab

## 2. Update Storage Rules
Replace the existing rules with these:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload files to their own folder
    match /journal_uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to upload test files
    match /test/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 3. Alternative: More Permissive Rules (for testing only)
If you want to test uploads quickly, you can use these more permissive rules (NOT recommended for production):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Common Issues and Solutions

### Issue: "Upload unauthorized"
- **Solution**: Check that the user is authenticated and the rules allow their user ID

### Issue: "Storage quota exceeded"
- **Solution**: Check your Firebase project's storage usage and limits

### Issue: "Bucket not found"
- **Solution**: Verify your Firebase configuration in `src/config/firebase.ts`

### Issue: "Network issues"
- **Solution**: Check your internet connection and try again

## 5. Testing the Rules
After updating the rules:
1. Wait a few minutes for the rules to propagate
2. Try uploading a small image file (< 1MB)
3. Check the browser console for detailed error messages
4. The app now shows progress and detailed error messages

## 6. Security Best Practices
- Always use user-specific folders (`journal_uploads/{userId}/`)
- Validate file types and sizes on both client and server
- Consider implementing virus scanning for uploaded files
- Monitor storage usage and implement cleanup strategies 