# CDK Express Website

Proyecto de infraestructura como código (IaC) usando AWS CDK con TypeScript para desplegar recursos de AWS con Lambda y S3.

## Descripción

Este proyecto utiliza AWS CDK para definir y desplegar infraestructura en AWS, incluyendo:

- **Lambda Function**: Función Lambda en Node.js 22.x que lista objetos de un bucket S3
- **Private S3 Bucket**: Bucket S3 privado con versionado y acceso controlado
- **IAM Policies**: Políticas de permisos para acceso seguro entre Lambda y S3
- **Custom Constructs**: Infraestructura modular y reutilizable

## Arquitectura

El stack despliega:

1. **S3 Bucket privado** (`my-private-bucket-vdiaz`)
   - Versionado habilitado
   - Acceso público bloqueado
   - RemovalPolicy: DESTROY (para desarrollo)

2. **Lambda Function** (usando el construct `LambdaProcessor`)
   - Runtime: Node.js 22.x
   - Handler: `index.handler`
   - Variables de entorno: `BUCKET_NAME`
   - Permisos: Lectura del bucket S3

3. **IAM Roles & Policies**
   - Rol de ejecución para Lambda
   - Política de lectura de S3 (GetObject)
   - Permisos gestionados con `grantRead`

## Estructura del Proyecto

```
cdk-express-website/
├── bin/
│   └── cdk-express-website.ts          # Entry point de la aplicación CDK
├── lib/
│   ├── cdk-express-website-stack.ts    # Stack principal con recursos
│   └── constructs/
│       ├── private-bucket.ts           # Construct para S3 Bucket privado
│       └── lambda.ts                   # Construct para Lambda Function
├── src/
│   └── lambda/
│       └── index.js                    # Código de la función Lambda
├── test/
│   └── cdk-express-website.test.ts     # Pruebas unitarias
├── cdk.json                            # Configuración de CDK
├── tsconfig.json                       # Configuración de TypeScript
└── package.json                        # Dependencias del proyecto
```

## Requisitos Previos

- **Node.js** (v14 o superior)
- **AWS CLI** configurado con credenciales válidas
- **AWS CDK CLI**: `npm install -g aws-cdk`
- **Cuenta AWS** con permisos para crear recursos

## Instalación

```bash
# Clonar el repositorio (si aplica)
git clone <tu-repo>
cd cdk-express-website

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

## Configuración de AWS

### Opción 1: AWS CLI (Recomendado)

```bash
aws configure
```

Ingresa:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (ej: `us-east-1`)
- Default output format (ej: `json`)

### Opción 2: Variables de entorno

```cmd
set AWS_ACCESS_KEY_ID=tu-access-key
set AWS_SECRET_ACCESS_KEY=tu-secret-key
set AWS_DEFAULT_REGION=us-east-1
```

## Comandos Útiles

### Desarrollo

```bash
npm run build   # Compila TypeScript a JavaScript
npm run watch   # Observa cambios y compila automáticamente
npm run test    # Ejecuta las pruebas unitarias con Jest
```

### AWS CDK

```bash
cdk synth       # Genera la plantilla de CloudFormation
cdk diff        # Compara el stack desplegado con el estado actual
cdk deploy      # Despliega el stack en tu cuenta AWS
cdk destroy     # Elimina el stack de AWS
```

### Primer Despliegue

```bash
# 1. Bootstrap CDK (solo primera vez por cuenta/región)
cdk bootstrap

# 2. Compilar el proyecto
npm run build

# 3. Revisar los cambios (opcional)
cdk diff

# 4. Desplegar
cdk deploy
```

## Uso de los Constructs

### PrivateBucket

Crea un bucket S3 privado con configuración personalizada:

```typescript
import { PrivateBucket } from './constructs/private-bucket';

const bucket = new PrivateBucket(this, 'MyPrivateBucket', {
  versioned: true,
  name: 'my-bucket-unique-name',
  publicReadAccess: false,
});

// Acceder al nombre del bucket
console.log(bucket.bucketName);
```

### LambdaProcessor

Crea una función Lambda con permisos y configuración:

```typescript
import { LambdaProcessor } from './constructs/lambda';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

const lambdaProcessor = new LambdaProcessor(this, 'MyLambda', {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: 'index.handler',
  codePath: 'src/lambda',
  environment: {
    BUCKET_NAME: bucket.bucketName,
  },
  rolePolicies: [
    new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::my-bucket/*'],
    }),
  ],
});
```

## Código de la Lambda Function

La función Lambda (`src/lambda/index.js`) utiliza AWS SDK v3 para listar objetos en el bucket S3:

```javascript
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

exports.handler = async (event) => {
  const s3 = new S3Client();
  const command = new ListObjectsV2Command({
    Bucket: process.env.BUCKET_NAME,
  });
  
  const data = await s3.send(command);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Objetos listados correctamente',
      count: data.Contents ? data.Contents.length : 0
    })
  };
};
```

## Migración a AWS SDK v3

El proyecto usa AWS SDK v3 (modular) en lugar de v2:

**❌ SDK v2 (antiguo):**
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const data = await s3.listObjectsV2(params).promise();
```

**✅ SDK v3 (actual):**
```javascript
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const s3 = new S3Client();
const data = await s3.send(new ListObjectsV2Command(params));
```

## Permisos IAM

La Lambda tiene los siguientes permisos:

- **s3:GetObject**: Leer objetos del bucket
- **s3:ListBucket**: Listar objetos del bucket (otorgado con `grantRead`)

## Notas Importantes

- **Nombres de buckets S3**: Deben ser únicos globalmente en AWS
- **RemovalPolicy.DESTROY**: El bucket se eliminará al destruir el stack (solo desarrollo)
- **AWS SDK v3**: Incluido por defecto en el runtime de Lambda Node.js 22.x
- **Logs**: Los logs de Lambda se almacenan en CloudWatch Logs

## Troubleshooting

### Error: "Unable to resolve AWS account"
- Asegúrate de tener credenciales configuradas: `aws configure`
- Verifica que las credenciales sean válidas: `aws sts get-caller-identity`

### Error: "Cannot find module 'aws-sdk'"
- Usa AWS SDK v3 con imports específicos
- El SDK v3 está incluido en el runtime de Lambda

### Error: "Bucket name already exists"
- Los nombres de buckets S3 son únicos globalmente
- Cambia el nombre del bucket en el stack

## Recursos

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [AWS Lambda Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)

## Licencia

Este proyecto está bajo la licencia especificada en el archivo LICENSE.
