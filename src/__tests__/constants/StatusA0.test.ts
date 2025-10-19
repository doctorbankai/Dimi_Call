import { ContactStatus } from '../../types';
import { STATUS_OPTIONS, STATUS_COLORS } from '../../constants';

describe('A0 Status Integration', () => {
  it('includes A0 in ContactStatus enum', () => {
    expect(ContactStatus.A0).toBe('A0');
    expect(Object.values(ContactStatus)).toContain('A0');
  });

  it('includes A0 in STATUS_OPTIONS', () => {
    expect(STATUS_OPTIONS).toContain(ContactStatus.A0);
  });

  it('has color configuration for A0 status', () => {
    const a0Colors = STATUS_COLORS[ContactStatus.A0];
    
    expect(a0Colors).toBeDefined();
    expect(a0Colors.bg).toBe('bg-purple-200');
    expect(a0Colors.text).toBe('text-purple-700');
    expect(a0Colors.darkBg).toBe('dark:bg-purple-600');
    expect(a0Colors.darkText).toBe('dark:text-purple-100');
  });

  it('has distinct colors from other statuses', () => {
    const a0Colors = STATUS_COLORS[ContactStatus.A0];
    const otherStatuses = Object.values(ContactStatus).filter(status => status !== ContactStatus.A0);
    
    otherStatuses.forEach(status => {
      const statusColors = STATUS_COLORS[status];
      expect(statusColors.bg).not.toBe(a0Colors.bg);
    });
  });

  it('maintains all existing statuses', () => {
    const expectedStatuses = [
      'Non défini',
      'Mauvais num',
      'Répondeur',
      'À rappeler',
      'Pas intéressé',
      'Argumenté',
      'D0',
      'R0',
      'Liste noire',
      'Prématuré',
      'A0'
    ];
    
    expect(Object.values(ContactStatus)).toEqual(expect.arrayContaining(expectedStatuses));
    expect(Object.values(ContactStatus)).toHaveLength(expectedStatuses.length);
  });
});