import { User } from '@/entities/user.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateCardDto, QueryCardDto, UpdateCardDto } from './dtos';
import { CardLink } from './entities/card-link.entity';
import { Card } from './entities/card.entity';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: EntityRepository<Card>,
    @InjectRepository(CardLink)
    private readonly linkRepository: EntityRepository<CardLink>,
    private readonly em: EntityManager,
  ) {}

  async create(userId: string, dto: CreateCardDto): Promise<Card> {
    const { links, ...cardData } = dto;
    const card = new Card({ ...cardData });

    card.user = this.em.getReference(User, userId);

    if (links) {
      card.links.set(links.map((link) => new CardLink(link)));
    }

    this.em.persist(card);

    await this.em.flush();

    return card;
  }

  async findPaged(query: QueryCardDto) {
    const qb = this.cardRepository.createQueryBuilder('c');

    // Filter by userId if it's meant to be personal
    // For now, let's assume this is the listing for the authenticated user
    // However, QueryCardDto might have a userId filter
    // Let's stick to a simple paged search for now

    const [items, total] = await qb
      .offset(query.skip)
      .limit(query.take)
      .orderBy({ createdAt: 'DESC' })
      .getResultAndCount();

    return {
      items,
      total,
      page: query.page!,
      pageSize: query.pageSize!,
    };
  }

  async findOne(id: string, userId?: string): Promise<Card> {
    const card = await this.cardRepository.findOneOrFail(id, {
      populate: ['links'],
    });

    if (userId && card.user.id !== userId) {
      throw new ForbiddenException('You do not own this card');
    }

    return card;
  }

  async findBySlug(slug: string): Promise<Card> {
    const card = await this.cardRepository.findOneOrFail(
      { slug },
      { populate: ['links'] },
    );

    return card;
  }

  async update(id: string, userId: string, dto: UpdateCardDto): Promise<Card> {
    const card = await this.findOne(id, userId);

    if (dto.slug && dto.slug !== card.slug) {
      const existing = await this.cardRepository.findOne({ slug: dto.slug });
      if (existing) {
        throw new ConflictException('Slug already taken');
      }
    }

    // Update basic properties
    const { links, ...rest } = dto;
    Object.assign(card, rest);

    // Update links if provided
    if (links) {
      // Simplest way: replace all
      card.links.set(links.map((l) => new CardLink(l)));
    }

    await this.em.flush();
    return card;
  }

  async remove(id: string, userId: string): Promise<void> {
    const card = await this.findOne(id, userId);
    this.em.remove(card);
    await this.em.flush();
  }
}
