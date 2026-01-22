import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { CreateWhiteboardDto } from './dtos/create-whiteboard.dto';
import { QueryWhiteboardDto } from './dtos/query-whiteboard.dto';
import { Whiteboard } from './entities/whiteboard.entity';

@Injectable()
export class WhiteboardsService {
  constructor(
    @InjectRepository(Whiteboard)
    private readonly whiteboardRepository: EntityRepository<Whiteboard>,
    private readonly em: EntityManager,
  ) {}

  async findPaged(query: QueryWhiteboardDto) {
    const qb = this.whiteboardRepository.createQueryBuilder('w');

    const [items, total] = await qb
      .offset(query.skip)
      .limit(query.take)
      .getResultAndCount();

    return {
      items,
      total,
      page: query.page!,
      pageSize: query.pageSize!,
    };
  }

  async findOne(id: string): Promise<Whiteboard> {
    const whiteboard = await this.whiteboardRepository.findOneOrFail({ id });
    return whiteboard;
  }

  /**
   * Safe method to fetch whiteboard content from background/gateway processes.
   * Uses a fork to avoid global context validation errors.
   */
  async findOneForGateway(id: string): Promise<Whiteboard> {
    const fork = this.em.fork();
    return fork.findOneOrFail(Whiteboard, { id });
  }

  async create(dto: CreateWhiteboardDto): Promise<Whiteboard> {
    const whiteboard = new Whiteboard({ name: dto.name });

    this.em.persist(whiteboard);
    await this.em.flush();

    return whiteboard;
  }

  async updateContent(id: string, content: Buffer): Promise<void> {
    const fork = this.em.fork();
    const whiteboard = await fork.findOneOrFail(Whiteboard, { id });
    whiteboard.content = content;
    await fork.flush();
  }
}
