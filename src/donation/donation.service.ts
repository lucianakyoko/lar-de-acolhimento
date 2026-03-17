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
