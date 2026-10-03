import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Fessior API Document',
    description: 'Tài liệu API cho hệ thống Online Code Judge',
    version: '1.0.0',
  },
  host: 'localhost:6868', // Đổi lại thành domain deploy sau này 
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Nhập Token theo định dạng: Bearer <Access_Token>'
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = [
    './src/modules/auth/auth.route.ts',
    './src/modules/auth/user.route.ts',
    './src/modules/matches/match_history.route.ts',
    './src/modules/problems/problem.route.ts',
    './src/modules/submissions/submission.route.ts',
];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);
