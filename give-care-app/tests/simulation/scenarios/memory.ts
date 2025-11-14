/**
 * Memory System E2E Scenarios
 *
 * Tests context persistence and retrieval:
 * - recordMemory saves with category and importance
 * - listMemories retrieves by importance
 * - Edge cases (non-existent user, concurrent writes)
 */

import type { Scenario } from '../types';

export const recordMemoryBasic: Scenario = {
  name: 'Memory - Record with Importance',
  description: 'recordMemory saves memory with category and importance score',
  tags: ['memory', 'context', 'persistence'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'callMutation',
      function: 'internal.memories.recordMemory',
      args: {
        userId: '{{userId}}',
        category: 'care_routine',
        content: 'Mom takes medication at 8am daily',
        importance: 9,
      },
    },
    {
      expect: 'memoryCreated',
      category: 'care_routine',
      importance: 9,
    },
    {
      action: 'callQuery',
      function: 'internal.memories.listMemories',
      args: {
        userId: '{{userId}}',
      },
    },
    {
      expect: 'memoriesReturned',
      count: 1,
      firstMemory: {
        category: 'care_routine',
        content: 'Mom takes medication at 8am daily',
        importance: 9,
      },
    },
  ],
  cleanup: true,
};

export const memoryImportanceOrdering: Scenario = {
  name: 'Memory - Retrieved by Importance',
  description: 'listMemories returns memories ordered by importance (high to low)',
  tags: ['memory', 'ordering'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    // Record multiple memories with different importance
    {
      action: 'callMutation',
      function: 'internal.memories.recordMemory',
      args: {
        userId: '{{userId}}',
        category: 'preference',
        content: 'Likes coffee in the morning',
        importance: 3,
      },
    },
    {
      action: 'callMutation',
      function: 'internal.memories.recordMemory',
      args: {
        userId: '{{userId}}',
        category: 'crisis_trigger',
        content: 'Becomes agitated when alone',
        importance: 10,
      },
    },
    {
      action: 'callMutation',
      function: 'internal.memories.recordMemory',
      args: {
        userId: '{{userId}}',
        category: 'care_routine',
        content: 'Physical therapy on Tuesdays',
        importance: 7,
      },
    },
    // Retrieve and verify order
    {
      action: 'callQuery',
      function: 'internal.memories.listMemories',
      args: {
        userId: '{{userId}}',
      },
    },
    {
      expect: 'memoriesOrdered',
      order: [10, 7, 3], // Importance scores in descending order
    },
  ],
  cleanup: true,
};

export const memoryCategoryFiltering: Scenario = {
  name: 'Memory - Filter by Category',
  description: 'listMemories can filter by specific category',
  tags: ['memory', 'filtering'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'callMutation',
      function: 'internal.memories.recordMemory',
      args: {
        userId: '{{userId}}',
        category: 'crisis_trigger',
        content: 'Sundowning occurs around 6pm',
        importance: 9,
      },
    },
    {
      action: 'callMutation',
      function: 'internal.memories.recordMemory',
      args: {
        userId: '{{userId}}',
        category: 'preference',
        content: 'Prefers warm bath before bed',
        importance: 5,
      },
    },
    {
      action: 'callQuery',
      function: 'internal.memories.listMemories',
      args: {
        userId: '{{userId}}',
        category: 'crisis_trigger',
      },
    },
    {
      expect: 'memoriesReturned',
      count: 1,
      allMatchCategory: 'crisis_trigger',
    },
  ],
  cleanup: true,
};

export const memoryEdgeCaseNonExistentUser: Scenario = {
  name: 'Memory - Non-Existent User Error',
  description: 'recordMemory throws error for non-existent user',
  tags: ['memory', 'edge-case', 'error-handling'],
  steps: [
    {
      action: 'callMutation',
      function: 'internal.memories.recordMemory',
      args: {
        userId: 'fake-user-id',
        category: 'care_routine',
        content: 'Test memory',
        importance: 5,
      },
      expectError: true,
    },
    {
      expect: 'errorThrown',
      message: 'User not found',
    },
  ],
  cleanup: false,
};

export const memoryEdgeCaseConcurrentWrites: Scenario = {
  name: 'Memory - Concurrent Write Safety',
  description: 'Multiple memories can be written concurrently without conflicts',
  tags: ['memory', 'edge-case', 'concurrency'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'callMutationParallel',
      mutations: [
        {
          function: 'internal.memories.recordMemory',
          args: {
            userId: '{{userId}}',
            category: 'care_routine',
            content: 'Memory 1',
            importance: 5,
          },
        },
        {
          function: 'internal.memories.recordMemory',
          args: {
            userId: '{{userId}}',
            category: 'preference',
            content: 'Memory 2',
            importance: 7,
          },
        },
        {
          function: 'internal.memories.recordMemory',
          args: {
            userId: '{{userId}}',
            category: 'crisis_trigger',
            content: 'Memory 3',
            importance: 9,
          },
        },
      ],
    },
    {
      action: 'callQuery',
      function: 'internal.memories.listMemories',
      args: {
        userId: '{{userId}}',
      },
    },
    {
      expect: 'memoriesReturned',
      count: 3,
    },
  ],
  cleanup: true,
};

export const memoryScenarios = [
  recordMemoryBasic,
  memoryImportanceOrdering,
  memoryCategoryFiltering,
  memoryEdgeCaseNonExistentUser,
  memoryEdgeCaseConcurrentWrites,
];
