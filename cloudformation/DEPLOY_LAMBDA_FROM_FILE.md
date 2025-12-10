# Alternative: Deploy Lambda from File Instead of Inline

If inline code keeps failing, we can deploy the Lambda from a file in S3.

## Steps:
1. Upload `lambda-handler-minimal.py` to S3
2. Reference it in CloudFormation instead of inline ZipFile
3. This is more reliable than inline code

Let me know if you want to try this approach instead.

