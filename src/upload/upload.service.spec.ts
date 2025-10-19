/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';
import { InternalServerErrorException } from '@nestjs/common';

describe('UploadService', () => {
  let uploadService: UploadService;

  beforeEach(async () => {
    // Configurar variáveis de ambiente padrão
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud-name';
    process.env.CLOUDINARY_API_KEY = 'test-api-key';
    process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

    // Configurar mocks antes de criar o módulo
    jest.spyOn(cloudinary, 'config').mockImplementation(() => ({}) as any);
    jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation();
    jest.spyOn(cloudinary.uploader, 'destroy').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: 'CLOUDINARY',
          useValue: cloudinary,
        },
      ],
    }).compile();

    uploadService = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  describe('constructor', () => {
    it('deve configurar o cloudinary corretamente com todas as variáveis de ambiente', () => {
      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'test-cloud-name',
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
      });
    });

    it('deve lançar erro se alguma variável de ambiente estiver faltando', () => {
      delete process.env.CLOUDINARY_API_KEY;
      expect(() => new UploadService()).toThrow(
        'Configuração do Cloudinary incompleta',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Variáveis de ambiente faltando: CLOUDINARY_API_KEY',
      );
    });
  });

  describe('uploadImage', () => {
    it('deve fazer upload de uma imagem e retornar a secure_url', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;
      const mockResult: UploadApiResponse = {
        public_id: 'test-public-id',
        version: 1,
        signature: 'test-signature',
        width: 100,
        height: 100,
        format: 'jpg',
        resource_type: 'image',
        created_at: '2023-01-01T00:00:00Z',
        bytes: 1024,
        type: 'upload',
        url: 'http://cloudinary.com/test.jpg',
        secure_url: 'https://cloudinary.com/test.jpg',
        access_mode: 'public',
        existing: false,
        pages: 1,
        frame_rate: 0,
        bit_rate: 0,
        duration: 0,
        is_audio: false,
        metadata: {},
        moderation: [],
        context: {},
        tags: [],
        etag: '',
        placeholder: false,
        original_filename: '',
        access_control: [],
      };

      jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((
        options: any,
        callback: any,
      ) => {
        if (callback) callback(undefined, mockResult);
        return { end: jest.fn() } as any;
      }) as any);

      jest
        .spyOn(streamifier, 'createReadStream')
        .mockReturnValue({ pipe: jest.fn() } as any);

      const result = await uploadService.uploadImage(mockFile);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'animals' },
        expect.any(Function),
      );
      expect(streamifier.createReadStream).toHaveBeenCalledWith(
        mockFile.buffer,
      );
      expect(result).toBe('https://cloudinary.com/test.jpg');
    });

    it('deve lançar erro se o arquivo não tiver buffer', async () => {
      const mockFile = { originalname: 'test.jpg' } as Express.Multer.File;

      await expect(uploadService.uploadImage(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it('deve lançar erro se o Cloudinary retornar um erro', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;
      const mockError: UploadApiErrorResponse = {
        name: 'UploadError',
        message: 'Upload error',
        http_code: 400,
      };

      jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((
        options: any,
        callback: any,
      ) => {
        if (callback) callback(mockError, undefined);
        return { end: jest.fn() } as any;
      }) as any);

      jest
        .spyOn(streamifier, 'createReadStream')
        .mockReturnValue({ pipe: jest.fn() } as any);

      await expect(uploadService.uploadImage(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(console.error).toHaveBeenCalledWith(
        'Erro ao fazer upload para o Cloudinary:',
        mockError,
      );
    });

    it('deve lançar erro se o resultado não contiver secure_url', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;
      const mockResult: UploadApiResponse = {
        public_id: 'test-public-id',
        version: 1,
        signature: 'test-signature',
        width: 100,
        height: 100,
        format: 'jpg',
        resource_type: 'image',
        created_at: '2023-01-01T00:00:00Z',
        bytes: 1024,
        type: 'upload',
        url: 'http://cloudinary.com/test.jpg',
        secure_url: '', // secure_url vazia para simular erro
        access_mode: 'public',
        existing: false,
        pages: 1,
        frame_rate: 0,
        bit_rate: 0,
        duration: 0,
        is_audio: false,
        metadata: {},
        moderation: [],
        context: {},
        tags: [],
        etag: '',
        placeholder: false,
        original_filename: '',
        access_control: [],
      };

      jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((
        options: any,
        callback: any,
      ) => {
        if (callback) callback(undefined, mockResult);
        return { end: jest.fn() } as any;
      }) as any);

      jest
        .spyOn(streamifier, 'createReadStream')
        .mockReturnValue({ pipe: jest.fn() } as any);

      await expect(uploadService.uploadImage(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteImage', () => {
    it('deve deletar uma imagem com sucesso', async () => {
      jest
        .spyOn(cloudinary.uploader, 'destroy')
        .mockResolvedValue({ result: 'ok' });

      await uploadService.deleteImage('test-public-id');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'test-public-id',
      );
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('deve logar aviso se a imagem não for encontrada', async () => {
      jest
        .spyOn(cloudinary.uploader, 'destroy')
        .mockResolvedValue({ result: 'not found' });

      await uploadService.deleteImage('test-public-id');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'test-public-id',
      );
      expect(console.warn).toHaveBeenCalledWith(
        'Imagem não encontrada ou erro ao deletar: test-public-id, resultado: not found',
      );
    });

    it('deve capturar erro sem lançar exceção', async () => {
      const mockError = new Error('Delete error');
      jest.spyOn(cloudinary.uploader, 'destroy').mockRejectedValue(mockError);

      await expect(
        uploadService.deleteImage('test-public-id'),
      ).resolves.toBeUndefined();
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'test-public-id',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Erro ao deletar imagem test-public-id no Cloudinary:',
        mockError,
      );
    });
  });
});
