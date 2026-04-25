const { z } = require('zod');
const { badRequest } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return badRequest(res, 'Validation failed', errors);
  }
  req.body = result.data;
  next();
};

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  pinned: z.boolean().default(false),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  isCompleted: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
};
