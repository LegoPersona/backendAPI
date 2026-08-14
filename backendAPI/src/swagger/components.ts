export const schemas = {
  ErrorResponse: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Something went wrong.' },
    },
    required: ['message'],
  },

  AuthTokens: {
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
    },
    required: ['accessToken', 'refreshToken'],
  },

  AuthenticatedUser: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      username: { type: 'string' },
      profileImageUrl: { type: 'string', nullable: true },
    },
    required: ['userId', 'username'],
  },

  Persona: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      attributes: { type: 'object', additionalProperties: true },
      modules: { type: 'object', additionalProperties: true },
      createdAt: { type: 'string', format: 'date-time' },
      partsJson: {
        type: 'array',
        items: { type: 'object', additionalProperties: { type: 'string' } },
        nullable: true,
      },
      personaImage: { type: 'string', nullable: true },
      originalImage: { type: 'string', nullable: true },
    },
    required: ['id', 'attributes', 'modules', 'createdAt'],
  },

  RateLimitStatus: {
    type: 'object',
    properties: {
      unlimited: { type: 'boolean' },
      limit: { type: 'integer' },
      used: { type: 'integer' },
      remaining: { type: 'integer' },
      resetsAt: { type: 'string', format: 'date-time', nullable: true },
    },
    required: ['unlimited', 'limit', 'used', 'remaining', 'resetsAt'],
  },

  GenerationTaskStatus: {
    type: 'object',
    properties: {
      jobId: { type: 'string' },
      status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] },
      percentCompleteEstimate: { type: 'integer' },
      actionDescription: { type: 'string', nullable: true },
      resultPersonaId: { type: 'string', nullable: true },
      errorMessage: { type: 'string', nullable: true },
      tokens_used: { type: 'integer', nullable: true },
    },
    required: ['jobId', 'status'],
  },

  GenerationTaskAccepted: {
    type: 'object',
    properties: {
      jobId: { type: 'string' },
      status: { type: 'string', enum: ['PENDING'] },
    },
    required: ['jobId', 'status'],
  },

  CurrentUserProfile: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', nullable: true },
          profileImageUrl: { type: 'string', nullable: true },
        },
        required: ['id', 'username', 'profileImageUrl'],
      },
      stats: {
        type: 'object',
        properties: {
          personasCount: { type: 'integer' },
          unlockedAchievementsCount: { type: 'integer' },
          totalAchievementsCount: { type: 'integer' },
        },
        required: ['personasCount', 'unlockedAchievementsCount', 'totalAchievementsCount'],
      },
      personas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            partsCount: { type: 'integer' },
            originalImageUrl: { type: 'string', nullable: true },
            legoImageUrl: { type: 'string', nullable: true },
            likesCount: { type: 'integer' },
            commentsCount: { type: 'integer' },
          },
        },
      },
      achievements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            isUnlocked: { type: 'boolean' },
            unlockedAt: { type: 'string', format: 'date-time', nullable: true },
            progress: { type: 'integer' },
            target: { type: 'integer' },
          },
        },
      },
    },
    required: ['user', 'stats', 'personas', 'achievements'],
  },

  CommunityComment: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      username: { type: 'string' },
      text: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'userId', 'username', 'text', 'createdAt'],
  },

  CommunityPersona: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          profileImageUrl: { type: 'string', nullable: true },
        },
        required: ['id', 'username', 'profileImageUrl'],
      },
      createdAt: { type: 'string', format: 'date-time' },
      legoImageUrl: { type: 'string', nullable: true },
      originalImageUrl: { type: 'string', nullable: true },
      tags: { type: 'array', items: { type: 'string' } },
      likes: { type: 'integer' },
      isLikedByUser: { type: 'boolean' },
      comments: { type: 'array', items: { $ref: '#/components/schemas/CommunityComment' } },
    },
    required: ['id', 'user', 'createdAt', 'tags', 'likes', 'isLikedByUser', 'comments'],
  },

  CommunityColorOption: {
    type: 'object',
    properties: {
      legoColorId: { type: 'integer' },
      name: { type: 'string' },
      hex: { type: 'string' },
    },
    required: ['legoColorId', 'name', 'hex'],
  },

  CommunityFilterOptions: {
    type: 'object',
    properties: {
      hairColors: { type: 'array', items: { $ref: '#/components/schemas/CommunityColorOption' } },
      skinTones: { type: 'array', items: { $ref: '#/components/schemas/CommunityColorOption' } },
    },
    required: ['hairColors', 'skinTones'],
  },
} as const;
