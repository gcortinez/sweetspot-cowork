import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
export declare const createBooking: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBooking: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelBooking: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBookings: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBookingById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMyBookings: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const processBookingApproval: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingApprovals: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const checkInToRoom: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkOutFromRoom: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const quickCheckIn: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const qrCheckIn: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBookingStatistics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUpcomingBookings: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getTodaysBookings: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=bookingManagementController.d.ts.map