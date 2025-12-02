// src/lambda/index.js

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

exports.handler = async (event) => {
  console.log('Evento recibido:', JSON.stringify(event));
  console.log('Bucket:', process.env.BUCKET_NAME);

  //Listar los objetos en el bucket uno a uno exponiendo key y size
  const s3 = new S3Client();
  const params = {
    Bucket: process.env.BUCKET_NAME,
  };
  try {
    const command = new ListObjectsV2Command(params);
    const data = await s3.send(command);
    
    if (data.Contents) {
      for (const object of data.Contents) {
        console.log('Objeto en el bucket:', object.Key, 'Size:', object.Size);
      }
    } else {
      console.log('El bucket está vacío');
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Objetos listados correctamente',
        count: data.Contents ? data.Contents.length : 0
      })
    };
  } catch (err) {
    console.error('Error al listar los objetos:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error al listar objetos',
        error: err.message
      })
    };
  }
};