import { CommunityMemberRepository, CommunityOrganizationRepository, CommunityUserRepository } from '@novu/dal';

export function getEERepository<T>(className: 'OrganizationRepository' | 'MemberRepository' | 'UserRepository'): T {
  switch (className) {
    case 'OrganizationRepository':
      return new CommunityOrganizationRepository() as T;
    case 'MemberRepository':
      return new CommunityMemberRepository() as T;
    case 'UserRepository':
      return new CommunityUserRepository() as T;
    default:
      throw new Error('Invalid repository name');
  }
}
