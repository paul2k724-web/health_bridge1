import Joi from 'joi';
import { objectId } from '../../shared/middleware/validate.middleware.js';

const notificationIdSchema = Joi.object({
  notificationId: objectId().required(),
});

export { notificationIdSchema };

export default { notificationIdSchema };
