import { Role } from '@/entities/role.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CreateRoleDto, QueryRoleDto, UpdateRoleDto } from './dtos';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: EntityRepository<Role>,
    private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const tenantId = this.cls.get('tenantId');
    const role = new Role({
      name: dto.name,
      permissions: dto.permissions,
      tenantId: tenantId ?? '',
    });

    await this.em.persistAndFlush(role);
    return role;
  }

  async findPaged(query: QueryRoleDto) {
    const [items, count] = await this.roleRepository.findAndCount(
      {},
      {
        limit: query.take,
        offset: query.skip,
        orderBy: { createdAt: 'DESC' },
      },
    );

    return {
      items,
      count,
      page: query.page!,
      pageSize: query.pageSize!,
    };
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ id });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (dto.name !== undefined) {
      role.name = dto.name;
    }
    if (dto.permissions !== undefined) {
      role.permissions = dto.permissions;
    }

    await this.em.flush();
    return role;
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.em.removeAndFlush(role);
  }
}
