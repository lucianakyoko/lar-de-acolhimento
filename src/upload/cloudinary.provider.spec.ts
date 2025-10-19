/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryProvider } from './cloudinary.provider';

describe('CloudinaryProvider', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    jest.spyOn(cloudinary, 'config').mockImplementation(() => ({}) as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve configurar o cloudinary com os valores do ConfigService', () => {
    const mockConfig = {
      cloud_name: 'test-cloud-name',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    };

    // Mock simples baseado na chave completa
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'CLOUDINARY_CLOUD_NAME') return mockConfig.cloud_name;
      if (key === 'CLOUDINARY_API_KEY') return mockConfig.api_key;
      if (key === 'CLOUDINARY_API_SECRET') return mockConfig.api_secret;
      return undefined;
    });

    CloudinaryProvider.useFactory(configService);

    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_CLOUD_NAME');
    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_API_KEY');
    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_API_SECRET');
    expect(cloudinary.config).toHaveBeenCalledWith(mockConfig);
  });

  it('deve lidar com variáveis de ambiente indefinidas', () => {
    jest.spyOn(configService, 'get').mockReturnValue(undefined);

    CloudinaryProvider.useFactory(configService);

    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_CLOUD_NAME');
    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_API_KEY');
    expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_API_SECRET');
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: undefined,
      api_key: undefined,
      api_secret: undefined,
    });
  });
});
