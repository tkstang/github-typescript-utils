import { describe, expect, it } from 'vitest';
import {
  camelToKebab,
  camelToSnake,
  capitalize,
  kebabToCamel,
  snakeToCamel,
  toTitleCase,
} from '../string-utils.js';

describe('snakeToCamel', () => {
  it('should convert snake_case to camelCase', () => {
    expect(snakeToCamel('hello_world')).toBe('helloWorld');
    expect(snakeToCamel('my_variable_name')).toBe('myVariableName');
    expect(snakeToCamel('single')).toBe('single');
    expect(snakeToCamel('')).toBe('');
  });

  it('should handle multiple underscores', () => {
    expect(snakeToCamel('a_b_c_d')).toBe('aBCD');
  });
});

describe('camelToSnake', () => {
  it('should convert camelCase to snake_case', () => {
    expect(camelToSnake('helloWorld')).toBe('hello_world');
    expect(camelToSnake('myVariableName')).toBe('my_variable_name');
    expect(camelToSnake('single')).toBe('single');
    expect(camelToSnake('')).toBe('');
  });

  it('should handle consecutive capitals', () => {
    expect(camelToSnake('XMLHttpRequest')).toBe('_x_m_l_http_request');
  });
});

describe('kebabToCamel', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(kebabToCamel('hello-world')).toBe('helloWorld');
    expect(kebabToCamel('my-variable-name')).toBe('myVariableName');
    expect(kebabToCamel('single')).toBe('single');
    expect(kebabToCamel('')).toBe('');
  });
});

describe('camelToKebab', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(camelToKebab('helloWorld')).toBe('hello-world');
    expect(camelToKebab('myVariableName')).toBe('my-variable-name');
    expect(camelToKebab('single')).toBe('single');
    expect(camelToKebab('')).toBe('');
  });
});

describe('capitalize', () => {
  it('should capitalize the first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
    expect(capitalize('a')).toBe('A');
    expect(capitalize('')).toBe('');
  });

  it('should not change already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });
});

describe('toTitleCase', () => {
  it('should convert strings to Title Case', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
    expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    expect(toTitleCase('UPPERCASE TEXT')).toBe('Uppercase Text');
    expect(toTitleCase('mixed CaSe WoRdS')).toBe('Mixed Case Words');
  });

  it('should handle single words', () => {
    expect(toTitleCase('hello')).toBe('Hello');
    expect(toTitleCase('WORLD')).toBe('World');
  });

  it('should handle empty strings', () => {
    expect(toTitleCase('')).toBe('');
  });
});
