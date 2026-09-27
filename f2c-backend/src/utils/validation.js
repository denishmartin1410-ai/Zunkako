/**
 * Input Validation Utilities for Zunkako Backend
 */

const isValidEmail = email => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const isValidPhone = phone => {
  return typeof phone === 'string' && /^[6-9]\d{9}$/.test(phone.trim());
};

const isValidString = str => {
  return typeof str === 'string' && str.trim().length > 0;
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidString,
};
