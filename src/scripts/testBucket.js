const Minio = require("minio");

async function main() {
  const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
  });

  try {
    const buckets = await minioClient.listBuckets();
    console.log("Success", buckets);
  } catch (err) {
    console.log(err.message);
  }
}

main();
