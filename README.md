# CDK Express Website - AWS Static Website with CI/CD Pipeline

Proyecto de infraestructura como código (IaC) usando AWS CDK con TypeScript para desplegar un sitio web estático con certificado SSL, CloudFront CDN y pipeline de CI/CD automatizado.

## 🎯 Descripción

Este proyecto utiliza AWS CDK para definir y desplegar una arquitectura completa de sitio web estático en AWS, incluyendo:

- **CloudFront Distribution**: CDN global para distribución de contenido con certificado SSL/TLS
- **S3 Static Website**: Bucket S3 privado con contenido del sitio web
- **ACM Certificate**: Certificado SSL/TLS para dominio personalizado con validación DNS
- **CI/CD Pipeline**: Pipeline automatizado con CodePipeline para despliegue continuo
- **SNS Notifications**: Notificaciones por email de estado del pipeline
- **Custom Domain**: Configuración para dominios personalizados (vdiaz-aws.cloud)

## 🏗️ Arquitectura

El proyecto se compone de múltiples stacks:

### 1. **CertificateStack** (us-east-1)
   - Certificado ACM para `vdiaz-aws.cloud` y `www.vdiaz-aws.cloud`
   - Validación DNS automática
   - Cross-region reference para uso en otras regiones

### 2. **CdkExpressWebsiteStack**
   - **S3 Bucket privado** con:
     - Acceso público bloqueado
     - Auto-eliminación de objetos
     - RemovalPolicy: DESTROY
   - **CloudFront Distribution** con:
     - Origin Access Control (OAC)
     - HTTPS redirect automático
     - Dominios personalizados
     - Caché optimizado (PriceClass_100)
     - Páginas de error personalizadas (404, 403)
   - **S3 Deployment** automático con:
     - Deploy del directorio `./site`
     - Invalidación automática de caché

### 3. **PipelineStack**
   - **CodePipeline** con:
     - Source: GitHub (via CodeConnections)
     - Build: npm install, build, synth
     - Deploy: Stage con CdkExpressWebsiteStack
   - **SNS Topic** para notificaciones
   - **EventBridge Rule** para alertas de fallos

## 📁 Estructura del Proyecto

```
cdk-express-website/
├── bin/
│   └── cdk-express-website.ts          # Entry point (CertificateStack + PipelineStack)
├── lib/
│   ├── certificate-stack.ts            # Stack de certificado ACM (us-east-1)
│   ├── cdk-express-website-stack.ts    # Stack principal (S3 + CloudFront)
│   ├── cdk-express-website-stage.ts    # Stage para pipeline
│   ├── pipeline-stack.ts               # Stack de CI/CD
│   └── constructs/
│       ├── private-bucket.ts           # Construct reutilizable para S3
│       └── lambda.ts                   # Construct para Lambda (no usado actualmente)
├── site/
│   ├── index.html                      # Página principal del portfolio
│   ├── error404.html                   # Página de error 404
│   └── error403.html                   # Página de error 403
├── src/
│   └── lambda/
│       └── index.js                    # Lambda de ejemplo (S3 listing)
├── test/
│   └── cdk-express-website.test.ts     # Tests unitarios completos
├── cdk.json                            # Configuración de CDK
├── tsconfig.json                       # Configuración de TypeScript
└── package.json                        # Dependencias del proyecto
```

## ✨ Características del Sitio Web

El sitio web desplegado ([site/index.html](site/index.html)) es un portfolio profesional que incluye:

- **Diseño moderno y responsivo** con gradientes y animaciones
- **Sección de estadísticas** (50+ stacks, 15+ servicios AWS, etc.)
- **Proyectos destacados**:
  - Aplicaciones serverless
  - Soluciones de almacenamiento seguro
  - Arquitecturas event-driven
  - Infraestructura multi-stack
  - Gestión de certificados SSL
  - Testing de infraestructura
- **Enlaces sociales** (GitHub, LinkedIn, Email)
- **Páginas de error personalizadas** con diseño consistente

## 🚀 Requisitos Previos

- **Node.js** (v14 o superior)
- **AWS CLI** configurado con credenciales válidas
- **AWS CDK CLI**: `npm install -g aws-cdk`
- **Cuenta AWS** con permisos para:
  - CloudFormation
  - S3
  - CloudFront
  - ACM (Certificate Manager)
  - CodePipeline
  - CodeBuild
  - SNS
  - IAM
- **GitHub Repository** con CodeConnections configurado

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/vdiazcorralejo/cdk-express-website.git
cd cdk-express-website

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

## ⚙️ Configuración

### 1. Configurar AWS CLI

```bash
aws configure
```

### 2. Configurar variables en los stacks

**En [`bin/cdk-express-website.ts`](bin/cdk-express-website.ts):**
- Verificar región del certificado (debe ser `us-east-1` para CloudFront)
- Configurar cuenta AWS

**En [`lib/cdk-express-website-stack.ts`](lib/cdk-express-website-stack.ts):**
- Actualizar `domainNames` con tu dominio
- Actualizar ARN del certificado (o usar cross-region reference)

**En [`lib/pipeline-stack.ts`](lib/pipeline-stack.ts):**
- Actualizar `codeConnectionArn` con tu CodeConnection
- Actualizar repositorio GitHub
- Actualizar email para notificaciones SNS

**En [`lib/certificate-stack.ts`](lib/certificate-stack.ts):**
- Actualizar `domainName` y `subjectAlternativeNames` con tu dominio

## 🛠️ Comandos Útiles

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
cdk deploy      # Despliega todos los stacks
cdk deploy CertificateStack         # Despliega solo el certificado
cdk deploy PipelineStack            # Despliega solo el pipeline
cdk destroy     # Elimina todos los stacks
```

### Primer Despliegue

```bash
# 1. Bootstrap CDK (solo primera vez por cuenta/región)
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/eu-west-1  # Si usas otra región

# 2. Compilar el proyecto
npm run build

# 3. Desplegar el certificado primero (en us-east-1)
cdk deploy CertificateStack

# 4. Esperar a que el certificado se valide (verificar DNS)

# 5. Desplegar el pipeline (incluye el website stack)
cdk deploy PipelineStack

# 6. Confirmar suscripción al SNS Topic (revisar email)
```

## 🧪 Tests

El proyecto incluye tests completos para:

- **CertificateStack**: Validación de certificado ACM
- **CdkExpressWebsiteStack**: 
  - Bucket S3 privado
  - CloudFront distribution
  - Dominios personalizados
  - SSL/TLS
  - Páginas de error
  - Origin Access Control
- **Constructs**:
  - PrivateBucket
  - LambdaProcessor
- **Integration Tests**: Cross-stack references

```bash
npm test
```

## 🔄 CI/CD Pipeline

El pipeline automatizado ejecuta:

1. **Source**: Detecta cambios en `main` branch de GitHub
2. **Build**: 
   - `npm ci` (instala dependencias)
   - `npm run build` (compila TypeScript)
   - `npx cdk synth` (sintetiza CloudFormation)
3. **Deploy**: Despliega el `CdkExpressWebsiteStage`
4. **Notifications**: Envía email si el pipeline falla

### Configurar CodeConnection

1. Ir a AWS Console → Developer Tools → Connections
2. Crear nueva conexión a GitHub
3. Autorizar acceso al repositorio
4. Copiar ARN de la conexión
5. Actualizar en [`lib/pipeline-stack.ts`](lib/pipeline-stack.ts)

## 🌐 Configuración de Dominio

### 1. Registrar dominio (Route 53 u otro registrador)

### 2. Crear Hosted Zone en Route 53

```bash
aws route53 create-hosted-zone --name vdiaz-aws.cloud --caller-reference $(date +%s)
```

### 3. Configurar Name Servers en el registrador

Copiar los NS records de la Hosted Zone y configurarlos en tu registrador.

### 4. El certificado se validará automáticamente

El [`CertificateStack`](lib/certificate-stack.ts) usa `CertificateValidation.fromDns()` que crea automáticamente los registros DNS necesarios.

## 📊 Recursos AWS Creados

- **CloudFormation Stacks**: 3 (Certificate, Pipeline, Website)
- **S3 Buckets**: 2 (Website + Pipeline artifacts)
- **CloudFront Distribution**: 1
- **ACM Certificate**: 1
- **CodePipeline**: 1
- **CodeBuild Project**: 1
- **SNS Topic**: 1
- **EventBridge Rules**: 1
- **IAM Roles**: Múltiples (Pipeline, CodeBuild, CloudFormation)

## 🔐 Seguridad

- **S3 Bucket**: Privado con `BlockPublicAccess.BLOCK_ALL`
- **CloudFront**: Origin Access Control (OAC) para acceso seguro a S3
- **HTTPS**: Forzado con `ViewerProtocolPolicy.REDIRECT_TO_HTTPS`
- **Certificado**: ACM con validación DNS
- **IAM**: Permisos mínimos necesarios con least privilege

## 💰 Costos Estimados

- **CloudFront**: ~$0.085 por GB transferido + requests
- **S3**: ~$0.023 por GB almacenado + requests
- **ACM Certificate**: Gratuito
- **CodePipeline**: $1/mes por pipeline
- **CodeBuild**: $0.005 por minuto de build
- **Route 53**: $0.50/mes por hosted zone

**Total estimado**: < $5/mes para sitio pequeño con bajo tráfico

## 🐛 Troubleshooting

### Error: "Certificate validation timed out"
- Verificar que los registros DNS se hayan creado en Route 53
- Esperar hasta 30 minutos para propagación DNS
- Verificar que la Hosted Zone esté configurada correctamente

### Error: "Unable to resolve AWS account"
```bash
aws sts get-caller-identity  # Verificar credenciales
aws configure                # Reconfigurar si es necesario
```

### Error: "CloudFront distribution domain already exists"
- Los dominios de CloudFront deben ser únicos
- Verificar que no exista otra distribución con el mismo dominio
- Eliminar distribución anterior si existe

### Error: "Pipeline execution failed"
- Revisar logs en CodeBuild
- Verificar que el repositorio GitHub esté accesible
- Confirmar que CodeConnection esté activo

## 📚 Recursos

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [ACM User Guide](https://docs.aws.amazon.com/acm/)
- [CodePipeline User Guide](https://docs.aws.amazon.com/codepipeline/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/s3/static-website-hosting/)

## 👤 Autor

**Vicente Díaz-Corralejo Arganda**
- GitHub: [@vdiazcorralejo](https://github.com/vdiazcorralejo)
- Email: vdiazcorralejo@gmail.com

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles.
