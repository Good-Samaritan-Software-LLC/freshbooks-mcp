/**
 * Tests for tool displayName generation (getDisplayName via getToolMetadata).
 *
 * Multi-word resource tokens are a single `_`-segment in the tool name; without
 * a compound-token map they render jammed (e.g. "Billpayment List"). #62.
 */
import { describe, it, expect } from 'vitest';
import { getToolMetadata, toolMetadataRegistry } from '../../src/tools/metadata.js';

const displayName = (tool: string) => getToolMetadata(tool)?.displayName;

describe('tool displayName generation', () => {
  it('spaces compound resource tokens', () => {
    expect(displayName('billpayment_list')).toBe('Bill Payment List');
    expect(displayName('billvendor_single')).toBe('Bill Vendor Single');
    expect(displayName('creditnote_create')).toBe('Credit Note Create');
    expect(displayName('expensecategory_list')).toBe('Expense Category List');
    expect(displayName('journalentry_create')).toBe('Journal Entry Create');
    expect(displayName('journalentryaccount_list')).toBe('Journal Entry Account List');
    expect(displayName('otherincome_update')).toBe('Other Income Update');
    expect(displayName('paymentoptions_single')).toBe('Payment Options Single');
    expect(displayName('timeentry_create')).toBe('Time Entry Create');
  });

  it('leaves single-word resource tokens unchanged', () => {
    expect(displayName('invoice_list')).toBe('Invoice List');
    expect(displayName('client_create')).toBe('Client Create');
    expect(displayName('payment_delete')).toBe('Payment Delete');
    expect(displayName('user_me')).toBe('User Me');
  });

  it('never produces a jammed compound token across the whole registry', () => {
    const jammed = [
      'Billpayment',
      'Billvendor',
      'Creditnote',
      'Expensecategory',
      'Journalentry',
      'Journalentryaccount',
      'Otherincome',
      'Paymentoptions',
      'Timeentry',
    ];
    for (const meta of toolMetadataRegistry.values()) {
      for (const bad of jammed) {
        expect(meta.displayName).not.toContain(bad);
      }
    }
  });
});
