import { Router } from 'express';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../../../controllers/admin/users.controller';

const usersRoutes = Router();

usersRoutes.get('/', listUsers);
usersRoutes.get('/:id', getUserById);
usersRoutes.post('/', createUser);
usersRoutes.patch('/:id', updateUser);
usersRoutes.delete('/:id', deleteUser);

export default usersRoutes;
