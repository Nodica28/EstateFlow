import { describe, expect, it } from 'vitest'
import { derivePipelineStage, tenantContactsFromLeasingOpportunities } from './domain-mappers'

describe('derivePipelineStage', () => {
  it('returns null when there are no opportunities', () => {
    expect(derivePipelineStage([])).toBeNull()
  })

  it('returns the only stage present', () => {
    expect(derivePipelineStage([{ stage: 'inquired' }])).toBe('inquired')
  })

  it('returns the highest stage regardless of input order', () => {
    const opps = [{ stage: 'showing' }, { stage: 'applied' }, { stage: 'inquired' }]
    expect(derivePipelineStage(opps)).toBe('applied')
    expect(derivePipelineStage([...opps].reverse())).toBe('applied')
  })

  it('ignores stages outside the known pipeline', () => {
    expect(derivePipelineStage([{ stage: 'archived' }, { stage: 'qualified' }])).toBe('qualified')
  })

  it('returns null when every stage is unrecognised or missing', () => {
    expect(derivePipelineStage([{ stage: 'archived' }, {}])).toBeNull()
  })
})

describe('tenantContactsFromLeasingOpportunities', () => {
  const tenant = { id: 'c1', first_name: 'Ada', last_name: 'Lovelace', type: 'tenant' }
  const prospect = { id: 'c2', first_name: 'Alan', last_name: 'Turing', type: 'prospect' }

  it('returns an empty list for undefined input', () => {
    expect(tenantContactsFromLeasingOpportunities(undefined)).toEqual([])
  })

  it('keeps tenants and drops prospects', () => {
    expect(
      tenantContactsFromLeasingOpportunities([{ contact: tenant }, { contact: prospect }])
    ).toEqual([tenant])
  })

  it('deduplicates a tenant linked through several opportunities', () => {
    const result = tenantContactsFromLeasingOpportunities([
      { contact: tenant },
      { contact: tenant },
    ])
    expect(result).toEqual([tenant])
  })

  it('skips rows with a null or id-less contact', () => {
    const result = tenantContactsFromLeasingOpportunities([
      { contact: null },
      { contact: { id: '', first_name: '', last_name: '', type: 'tenant' } },
      { contact: tenant },
    ])
    expect(result).toEqual([tenant])
  })
})
