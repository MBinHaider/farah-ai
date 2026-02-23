import { describe, it, expect } from 'vitest'
import { buildParsePrompt, buildGeneratePrompt } from '@/lib/ai/prompts'

describe('buildParsePrompt', () => {
  it('includes the raw text in the prompt', () => {
    const prompt = buildParsePrompt('2 cups flour, 1 egg. Mix and bake.')
    expect(prompt).toContain('2 cups flour, 1 egg. Mix and bake.')
  })
  it('requests JSON output', () => {
    const prompt = buildParsePrompt('any recipe text')
    expect(prompt.toLowerCase()).toContain('json')
  })
  it('requests bilingual output', () => {
    const prompt = buildParsePrompt('any recipe text')
    expect(prompt).toContain('Arabic')
    expect(prompt).toContain('English')
  })
})

describe('buildGeneratePrompt', () => {
  it('includes the user description', () => {
    const prompt = buildGeneratePrompt('healthy chicken pasta')
    expect(prompt).toContain('healthy chicken pasta')
  })
  it('requests structured recipe format', () => {
    const prompt = buildGeneratePrompt('any dish')
    expect(prompt.toLowerCase()).toContain('ingredients')
    expect(prompt.toLowerCase()).toContain('steps')
  })
})
