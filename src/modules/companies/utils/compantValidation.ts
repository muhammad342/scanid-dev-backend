import { body, ValidationChain } from 'express-validator';

export const companyValidation: ValidationChain[] = [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters')
      .trim(),
    body('companyAdminId')
      .optional()
      .isUUID()
      .withMessage('Company admin ID must be a valid UUID'),
    body('totalSeats')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Total seats must be a non-negative integer'),
    body('type')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Company type must be between 1 and 50 characters'),
    body('title')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Company title must be between 1 and 100 characters'),
    body('channelPartnerSplit')
      .optional()
      .isBoolean()
      .withMessage('Channel partner split must be a boolean value'),
    body('commission')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Commission must be a number between 0 and 100'),
    body('paymentMethod')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Payment method must be between 1 and 50 characters'),
  ];
  
// PIN management validation
export const pinManagementValidation: ValidationChain[] = [
    body('masterPin')
      .optional()
      .isString()
      .isLength({ min: 4, max: 12 })
      .withMessage('Master PIN must be between 4 and 12 characters'),
    body('pinOptions')
      .optional()
      .isObject()
      .withMessage('PIN options must be an object'),
    body('pinOptions.documents')
      .optional()
      .isBoolean()
      .withMessage('documents option must be a boolean'),
    body('pinOptions.notes')
      .optional()
      .isBoolean()
      .withMessage('notes option must be a boolean'),
    body('pinOptions.certificates')
      .optional()
      .isBoolean()
      .withMessage('certificates option must be a boolean'),
    body('pinSettings')
      .optional()
      .isObject()
      .withMessage('PIN settings must be an object'),
    body('pinSettings.requireToView')
      .optional()
      .isBoolean()
      .withMessage('requireToView setting must be a boolean'),
    body('pinSettings.requireToEdit')
      .optional()
      .isBoolean()
      .withMessage('requireToEdit setting must be a boolean'),
  ];
  
  export const validatePinValidation: ValidationChain[] = [
    body('pin')
      .isString()
      .isLength({ min: 4, max: 12 })
      .withMessage('PIN must be between 4 and 12 characters'),
  ];
    