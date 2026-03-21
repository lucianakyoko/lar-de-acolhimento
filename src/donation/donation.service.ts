import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Donation, DonationDocument } from './schema/donation.schema';
import { Model } from 'mongoose';
import { CreateDonationDto } from './dto/create-donation.dto';
import { Animal } from '../animal/schema/animal.schema';

@Injectable()
export class DonationService {
  constructor(
    @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
    @InjectModel(Animal.name) private animalModel: Model<Animal>,
  ) {}

  async create(createDonationDto: CreateDonationDto): Promise<Donation> {
    return this.donationModel.create(createDonationDto);
  }

  async findAll(): Promise<Donation[]> {
    return this.donationModel
      .find()
      .populate('animalId')
      .populate('donatedItems.itemId');
  }

  async findOne(id: string): Promise<Donation> {
    const donation = await this.donationModel
      .findById(id)
      .populate('animalId')
      .populate('donatedItems.itemId');

    if (!donation) throw new NotFoundException('Donation not found');

    return donation;
  }

  async getDonationsGroupedByAnimal(): Promise<any[]> {
    const result = await this.donationModel.aggregate([
      // 1. Agrupar por animalId
      {
        $group: {
          _id: '$animalId',
          donations: { $push: '$$ROOT' },
          totalExtraAmount: { $sum: { $ifNull: ['$extraAmount', 0] } },
          donationCount: { $sum: 1 },
        },
      },

      // 2. Lookup para animal (convertendo animalId string → ObjectId)
      {
        $lookup: {
          from: 'animals',
          let: { animalIdStr: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$animalIdStr' }],
                },
              },
            },
          ],
          as: 'animal',
        },
      },

      // 3. Desembrulhar (mantém mesmo se não encontrar, mas vamos filtrar depois)
      {
        $unwind: {
          path: '$animal',
          preserveNullAndEmptyArrays: true,
        },
      },

      // 4. FILTRAR: só mantém grupos onde o animal realmente existe
      {
        $match: {
          animal: { $ne: null },
        },
      },

      // 5. Calcular valor total dos itens doados
      {
        $addFields: {
          totalDonatedItemsValue: {
            $sum: {
              $map: {
                input: '$donations',
                as: 'donation',
                in: {
                  $sum: {
                    $map: {
                      input: '$$donation.donatedItems',
                      as: 'item',
                      in: {
                        $multiply: [
                          '$$item.quantity',
                          {
                            $let: {
                              vars: {
                                need: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: {
                                          $ifNull: ['$animal.needsList', []],
                                        },
                                        as: 'need',
                                        cond: {
                                          $eq: [
                                            '$$need._id',
                                            { $toObjectId: '$$item.itemId' },
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: { $ifNull: ['$$need.price', 0] },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // 6. Formatar saída final
      {
        $project: {
          _id: 0,
          animal: {
            $mergeObjects: [
              '$animal',
              {
                __v: '$$REMOVE',
                updatedAt: '$$REMOVE',
                createdAt: '$$REMOVE',
              },
            ],
          },
          donations: {
            $map: {
              input: '$donations',
              as: 'd',
              in: {
                _id: '$$d._id',
                donorName: '$$d.donorName',
                totalDonation: {
                  $round: [
                    {
                      $add: [
                        { $ifNull: ['$$d.extraAmount', 0] },
                        {
                          $sum: {
                            $map: {
                              input: '$$d.donatedItems',
                              as: 'item',
                              in: {
                                $multiply: [
                                  '$$item.quantity',
                                  {
                                    $let: {
                                      vars: {
                                        need: {
                                          $arrayElemAt: [
                                            {
                                              $filter: {
                                                input: {
                                                  $ifNull: [
                                                    '$animal.needsList',
                                                    [],
                                                  ],
                                                },
                                                as: 'n',
                                                cond: {
                                                  $eq: [
                                                    '$$n._id',
                                                    {
                                                      $toObjectId:
                                                        '$$item.itemId',
                                                    },
                                                  ],
                                                },
                                              },
                                            },
                                            0,
                                          ],
                                        },
                                      },
                                      in: { $ifNull: ['$$need.price', 0] },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                    2,
                  ],
                },
                extraAmount: '$$d.extraAmount',
                createdAt: '$$d.createdAt',

                donatedItems: {
                  $map: {
                    input: '$$d.donatedItems',
                    as: 'item',
                    in: {
                      itemId: '$$item.itemId',
                      quantity: '$$item.quantity',

                      // Busca o item correspondente no needsList do animal
                      name: {
                        $let: {
                          vars: {
                            need: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: {
                                      $ifNull: ['$animal.needsList', []],
                                    },
                                    as: 'n',
                                    cond: {
                                      $eq: [
                                        '$$n._id',
                                        { $toObjectId: '$$item.itemId' },
                                      ],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            $ifNull: ['$$need.name', 'Item não encontrado'],
                          },
                        },
                      },

                      value: {
                        $let: {
                          vars: {
                            need: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: {
                                      $ifNull: ['$animal.needsList', []],
                                    },
                                    as: 'n',
                                    cond: {
                                      $eq: [
                                        '$$n._id',
                                        { $toObjectId: '$$item.itemId' },
                                      ],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            $multiply: [
                              '$$item.quantity',
                              { $ifNull: ['$$need.price', 0] },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          totalExtraAmount: { $round: ['$totalExtraAmount', 2] },
          totalDonatedItemsValue: { $round: ['$totalDonatedItemsValue', 2] },
          totalValue: {
            $round: [
              { $add: ['$totalExtraAmount', '$totalDonatedItemsValue'] },
              2,
            ],
          },
          donationCount: 1,
        },
      },

      // 7. Ordenar por valor total descendente (ou mude para outra ordem)
      { $sort: { totalValue: -1 } },
    ]);

    return result;
  }

  async findByAnimal(
    animalId: string,
  ): Promise<{ animal: Animal; donations: Donation[] } | { message: string }> {
    const animal = await this.animalModel.findById(animalId);

    if (!animal) throw new NotFoundException('Animal not found');

    const donations = await this.donationModel
      .find({ animalId })
      .select('-animalId -updatedAt -__v')
      .lean();

    if (!donations.length) {
      return { message: 'No donations found for this animal.' };
    }

    return {
      animal,
      donations,
    };
  }

  async remove(id: string): Promise<void> {
    const result = await this.donationModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Donation not found');
  }

  async getSummary(): Promise<{
    totalDonationsAmount: number;
    totalDonors: number;
    totalAnimals: number;
  }> {
    // Total de animais cadastrados
    const totalAnimals = await this.animalModel.countDocuments();

    // Total de doadores únicos
    const donorStats = await this.donationModel.aggregate([
      { $group: { _id: '$donorName' } },
      { $count: 'uniqueDonors' },
    ]);

    const totalDonors =
      (donorStats[0] as { uniqueDonors: number } | undefined)?.uniqueDonors ??
      0;

    // 3. Valor total das doações (extraAmount + valor dos itens doados)
    const valueStats: Array<{
      totalExtraAmount: number;
      totalItemsValue: number;
    }> = await this.donationModel.aggregate([
      {
        $unwind: {
          path: '$donatedItems',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'animals',
          localField: 'animalId',
          foreignField: '_id',
          as: 'animalDoc',
        },
      },
      { $unwind: { path: '$animalDoc', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          itemTotalValue: {
            $multiply: [
              {
                $let: {
                  vars: {
                    need: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$animalDoc.needsList',
                            as: 'item',
                            cond: {
                              $eq: ['$$item._id', '$donatedItems.itemId'],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: { $ifNull: ['$$need.price', 0] },
                },
              },
              '$donatedItems.quantity',
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalExtraAmount: { $sum: { $ifNull: ['$extraAmount', 0] } },
          totalItemsValue: { $sum: { $ifNull: ['$itemTotalValue', 0] } },
        },
      },
    ]);

    const totalExtra = valueStats[0]?.totalExtraAmount ?? 0;
    const totalItems = valueStats[0]?.totalItemsValue ?? 0;
    const totalDonationsAmount = Number((totalExtra + totalItems).toFixed(2));

    return {
      totalDonationsAmount,
      totalDonors,
      totalAnimals,
    };
  }
}
