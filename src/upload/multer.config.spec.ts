import { memoryStorage } from 'multer';
import { multerConfig } from './multer.config';

describe('multerConfig', () => {
  it('deve configurar o Multer com memoryStorage e limite de 4MB', () => {
    expect(multerConfig.storage).toEqual(memoryStorage());
    expect(multerConfig.limits).toEqual({ fileSize: 4 * 1024 * 1024 });
  });
});
