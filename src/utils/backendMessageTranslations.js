import i18n from '../i18n/config';

const ARABIC_BACKEND_MESSAGES = {
  'A pending invitation already exists for this email': 'توجد دعوة معلقة بالفعل لهذا البريد الإلكتروني',
  'A user with this email already exists in the organization': 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل في المؤسسة',
  'A user with this email already exists in the target organization': 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل في المؤسسة المستهدفة',
  'Absent users check completed': 'اكتمل فحص المستخدمين الغائبين',
  'Admin user not found': 'لم يتم العثور على المستخدم المسؤول',
  'Attendance log not found': 'لم يتم العثور على سجل الحضور',
  'Attendance log updated successfully': 'تم تحديث سجل الحضور بنجاح',
  'Authentication failed. Please log in again.': 'فشلت المصادقة. يرجى تسجيل الدخول مرة أخرى.',
  'Can only cancel pending leave requests': 'يمكن إلغاء طلبات الإجازة المعلقة فقط',
  'Cleanup completed': 'اكتملت عملية التنظيف',
  'Current password is incorrect': 'كلمة المرور الحالية غير صحيحة',
  'Department code must use lowercase letters, numbers, hyphens, or underscores': 'يجب أن يحتوي رمز القسم على أحرف صغيرة أو أرقام أو شرطات أو شرطات سفلية فقط',
  'Duplicate field value entered': 'تم إدخال قيمة مكررة في أحد الحقول',
  'Email verified successfully': 'تم التحقق من البريد الإلكتروني بنجاح',
  'Employee email not found': 'لم يتم العثور على البريد الإلكتروني للموظف',
  'Employee not found': 'لم يتم العثور على الموظف',
  'Form instance deleted successfully': 'تم حذف النموذج المعبأ بنجاح',
  'Form instance not found': 'لم يتم العثور على النموذج المعبأ',
  'Form template deleted successfully': 'تم حذف قالب النموذج بنجاح',
  'Form template not found': 'لم يتم العثور على قالب النموذج',
  'If an account with that email exists, a password reset link has been sent': 'إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور',
  'If an account with that email exists, a password reset request has been sent to administrators': 'إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال طلب إعادة تعيين كلمة المرور إلى المسؤولين',
  'Image deleted successfully': 'تم حذف الصورة بنجاح',
  'Image file is required': 'ملف الصورة مطلوب',
  'Image not found': 'لم يتم العثور على الصورة',
  'Images uploaded successfully': 'تم رفع الصور بنجاح',
  'Invalid response from server': 'استجابة غير صالحة من الخادم',
  'Invalid credentials': 'بيانات تسجيل الدخول غير صحيحة',
  'Invalid or expired reset token': 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية',
  'Invalid or expired verification code': 'رمز التحقق غير صالح أو منتهي الصلاحية',
  'Invalid QR code': 'رمز QR غير صالح',
  'Invalid refresh token': 'رمز التحديث غير صالح',
  'Invitation acceptance failed': 'فشل قبول الدعوة',
  'Invitation does not belong to the active organization': 'هذه الدعوة لا تنتمي إلى المؤسسة النشطة',
  'Invitation not found': 'لم يتم العثور على الدعوة',
  'Invitation not found or is no longer active': 'الدعوة غير موجودة أو لم تعد نشطة',
  'Invitee email is required': 'البريد الإلكتروني للشخص المدعو مطلوب',
  'Leave request deleted successfully': 'تم حذف طلب الإجازة بنجاح',
  'Leave request not found': 'لم يتم العثور على طلب الإجازة',
  'Logged out successfully': 'تم تسجيل الخروج بنجاح',
  'Login failed': 'فشل تسجيل الدخول',
  'Message not found': 'لم يتم العثور على الرسالة',
  'Multiple organizations matched this account. Please provide an organization slug.': 'تم العثور على عدة مؤسسات لهذا الحساب. يرجى إدخال معرف المؤسسة.',
  'No active QR code found': 'لم يتم العثور على رمز QR نشط',
  'No images uploaded': 'لم يتم رفع أي صور',
  'No refresh token available': 'رمز التحديث غير متوفر',
  'Not authorized to access this route': 'غير مصرح لك بالوصول إلى هذا المسار',
  'Notification not found': 'لم يتم العثور على الإشعار',
  'Only image uploads are allowed for branding assets': 'يُسمح فقط برفع الصور لأصول العلامة التجارية',
  'Only pending invitations can be cancelled': 'يمكن إلغاء الدعوات المعلقة فقط',
  'Organization context is required': 'سياق المؤسسة مطلوب',
  'Organization is not active': 'المؤسسة غير نشطة',
  'Organization name is required': 'اسم المؤسسة مطلوب',
  'Organization not found': 'لم يتم العثور على المؤسسة',
  'Organization not found for this invitation': 'لم يتم العثور على المؤسسة لهذه الدعوة',
  'Organization not found for this session': 'لم يتم العثور على المؤسسة لهذه الجلسة',
  'Organization slug must use lowercase letters, numbers, and hyphens only': 'يجب أن يحتوي معرف المؤسسة على أحرف صغيرة وأرقام وشرطات فقط',
  'Password changed successfully': 'تم تغيير كلمة المرور بنجاح',
  'Password must be at least 6 characters': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
  'Password reset successfully': 'تمت إعادة تعيين كلمة المرور بنجاح',
  'Please provide a new password': 'يرجى إدخال كلمة مرور جديدة',
  'Please provide all required fields': 'يرجى إدخال جميع الحقول المطلوبة',
  'Please provide an email address': 'يرجى إدخال عنوان البريد الإلكتروني',
  'Please provide current and new password': 'يرجى إدخال كلمة المرور الحالية والجديدة',
  'Please provide email and password': 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
  'Please provide email and verification code': 'يرجى إدخال البريد الإلكتروني ورمز التحقق',
  'Please provide name, email, and password': 'يرجى إدخال الاسم والبريد الإلكتروني وكلمة المرور',
  'Please provide new password': 'يرجى إدخال كلمة المرور الجديدة',
  'Please provide organization name, admin name, email, and password': 'يرجى إدخال اسم المؤسسة واسم المسؤول والبريد الإلكتروني وكلمة المرور',
  'Please provide your email address': 'يرجى إدخال عنوان بريدك الإلكتروني',
  'Please verify your email before registering the organization': 'يرجى التحقق من بريدك الإلكتروني قبل تسجيل المؤسسة',
  'QR code has expired': 'انتهت صلاحية رمز QR',
  'QR code has expired or is no longer active': 'انتهت صلاحية رمز QR أو لم يعد نشطاً',
  'Recipient is required': 'المستلم مطلوب',
  'Refresh token is required': 'رمز التحديث مطلوب',
  'Refresh token expired': 'انتهت صلاحية رمز التحديث',
  'Refresh token organization does not match the active organization': 'مؤسسة رمز التحديث لا تطابق المؤسسة النشطة',
  'Registration failed': 'فشل التسجيل',
  'Report sent successfully': 'تم إرسال التقرير بنجاح',
  'Reset token does not belong to the active organization': 'رمز إعادة التعيين لا ينتمي إلى المؤسسة النشطة',
  'Resource not found': 'لم يتم العثور على المورد',
  'Route not found': 'لم يتم العثور على المسار',
  'Server Error': 'خطأ في الخادم',
  'Self-service password reset is disabled for this account. Please request a password reset from an administrator.': 'إعادة تعيين كلمة المرور الذاتية معطلة لهذا الحساب. يرجى طلب إعادة تعيين كلمة المرور من أحد المسؤولين.',
  'Session expired': 'انتهت صلاحية الجلسة',
  'Session is no longer valid. Please sign in again.': 'لم تعد الجلسة صالحة. يرجى تسجيل الدخول مرة أخرى.',
  'Status must be either approved or rejected': 'يجب أن تكون الحالة إما موافق عليها أو مرفوضة',
  'Subject and content are required': 'الموضوع والمحتوى مطلوبان',
  'Template ID is required': 'معرف القالب مطلوب',
  'This leave request has already been processed': 'تمت معالجة طلب الإجازة هذا بالفعل',
  'Token and type are required': 'الرمز والنوع مطلوبان',
  'Token is not valid': 'الرمز غير صالح',
  'Token organization does not match the active organization': 'مؤسسة الرمز لا تطابق المؤسسة النشطة',
  'Token refresh failed': 'فشل تحديث الجلسة',
  'Token, name, and password are required': 'الرمز والاسم وكلمة المرور مطلوبة',
  'Too many login attempts': 'عدد محاولات تسجيل الدخول كبير جداً',
  'Too many login attempts, please try again later': 'عدد محاولات تسجيل الدخول كبير جداً، يرجى المحاولة مرة أخرى لاحقاً',
  'Too many login attempts, please try again later.': 'عدد محاولات تسجيل الدخول كبير جداً، يرجى المحاولة مرة أخرى لاحقاً.',
  'Too many requests': 'طلبات كثيرة جداً',
  'Too many requests from this IP, please try again later.': 'عدد كبير جداً من الطلبات من هذا العنوان. يرجى المحاولة مرة أخرى لاحقاً.',
  'Type must be either checkin or checkout': 'يجب أن يكون النوع إما checkin أو checkout',
  'Unable to load organization context': 'تعذر تحميل بيانات المؤسسة',
  'Unable to resolve organization for this account': 'تعذر تحديد المؤسسة لهذا الحساب',
  'Unable to send verification code': 'تعذر إرسال رمز التحقق',
  'Unable to send verification code right now': 'تعذر إرسال رمز التحقق حالياً',
  'Unable to verify email': 'تعذر التحقق من البريد الإلكتروني',
  'User account is deactivated': 'تم تعطيل حساب المستخدم',
  'User already exists with this email in this organization': 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل في هذه المؤسسة',
  'User deleted successfully': 'تم حذف المستخدم بنجاح',
  'User does not belong to the active organization': 'المستخدم لا ينتمي إلى المؤسسة النشطة',
  'User not found': 'لم يتم العثور على المستخدم',
  'User role changed. Please sign in again.': 'تم تغيير دور المستخدم. يرجى تسجيل الدخول مرة أخرى.',
  'Validation failed': 'فشل التحقق من صحة البيانات',
  'Verification code sent to your email': 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
  'You already have a leave request for this period': 'لديك بالفعل طلب إجازة لهذه الفترة',
  'You cannot change your own role': 'لا يمكنك تغيير دورك الخاص',
  'You cannot deactivate your own account': 'لا يمكنك تعطيل حسابك الخاص',
  'You cannot delete your own account': 'لا يمكنك حذف حسابك الخاص',
  'You do not have access to cancel this invitation': 'ليست لديك صلاحية إلغاء هذه الدعوة',
  'You do not have access to create invitations for this organization': 'ليست لديك صلاحية إنشاء دعوات لهذه المؤسسة',
  'You do not have access to invitation management for this organization': 'ليست لديك صلاحية إدارة الدعوات لهذه المؤسسة',
  'You do not have access to this department': 'ليست لديك صلاحية الوصول إلى هذا القسم',
  'You do not have access to update organization branding': 'ليست لديك صلاحية تحديث هوية المؤسسة',
  'You do not have access to update organization settings': 'ليست لديك صلاحية تحديث إعدادات المؤسسة',
  'You do not have permission to cancel this leave request': 'ليست لديك صلاحية إلغاء طلب الإجازة هذا',
  'You do not have permission to delete this leave request': 'ليست لديك صلاحية حذف طلب الإجازة هذا',
  'You do not have permission to update this leave request': 'ليست لديك صلاحية تحديث طلب الإجازة هذا',
  'You have already checked in today': 'لقد سجلت الحضور بالفعل اليوم',
  'You have already checked out today': 'لقد سجلت الانصراف بالفعل اليوم',
  'You must check in before checking out': 'يجب تسجيل الحضور قبل تسجيل الانصراف',
  'Your account has been deactivated': 'تم تعطيل حسابك',
  'Your session has expired': 'انتهت صلاحية جلستك',
  'Your session has expired. Please log in again.': 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
  'atsha Server is running': 'خادم أتشا يعمل'
};

const normalizeLanguage = (language = '') => (
  String(language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en'
);

export const getSelectedLanguage = () => {
  if (typeof window !== 'undefined') {
    const storedLanguage = window.localStorage.getItem('language');
    if (storedLanguage) {
      return normalizeLanguage(storedLanguage);
    }
  }

  return normalizeLanguage(i18n.language);
};

const translateCommaSeparatedMessage = (message, language) => {
  if (language !== 'ar' || !message.includes(', ')) {
    return message;
  }

  const parts = message.split(', ');
  const translatedParts = parts.map((part) => ARABIC_BACKEND_MESSAGES[part] || part);
  const hasTranslation = translatedParts.some((part, index) => part !== parts[index]);

  return hasTranslation ? translatedParts.join('، ') : message;
};

export const translateBackendMessage = (message, language = getSelectedLanguage()) => {
  if (typeof message !== 'string') {
    return message;
  }

  const normalizedMessage = message.trim();
  if (!normalizedMessage || language !== 'ar') {
    return normalizedMessage || message;
  }

  return ARABIC_BACKEND_MESSAGES[normalizedMessage]
    || translateCommaSeparatedMessage(normalizedMessage, language);
};

export const localizeBackendPayload = (payload, language = getSelectedLanguage()) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (typeof payload.message === 'string') {
    payload.message = translateBackendMessage(payload.message, language);
  }

  if (typeof payload.error === 'string') {
    payload.error = translateBackendMessage(payload.error, language);
  }

  if (Array.isArray(payload.errors)) {
    payload.errors = payload.errors.map((entry) => translateBackendMessage(entry, language));
  }

  return payload;
};

export const getLocalizedRateLimitMessage = (retryAfterSeconds, language = getSelectedLanguage()) => {
  if (language !== 'ar') {
    if (!retryAfterSeconds) {
      return 'Too many requests. Please wait a moment before trying again.';
    }

    if (retryAfterSeconds < 60) {
      return `Too many requests. Please wait ${retryAfterSeconds} second${retryAfterSeconds > 1 ? 's' : ''} before trying again.`;
    }

    const minutes = Math.floor(retryAfterSeconds / 60);
    return `Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
  }

  if (!retryAfterSeconds) {
    return 'طلبات كثيرة جداً. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.';
  }

  if (retryAfterSeconds < 60) {
    return `طلبات كثيرة جداً. يرجى الانتظار ${retryAfterSeconds} ثانية قبل المحاولة مرة أخرى.`;
  }

  const minutes = Math.floor(retryAfterSeconds / 60);
  return `طلبات كثيرة جداً. يرجى الانتظار ${minutes} دقيقة قبل المحاولة مرة أخرى.`;
};

export const getLocalizedSessionExpiredMessage = (language = getSelectedLanguage()) => (
  language === 'ar'
    ? 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.'
    : 'Your session has expired. Please log in again.'
);

export const getLocalizedAuthenticationFailedMessage = (language = getSelectedLanguage()) => (
  language === 'ar'
    ? 'فشلت المصادقة. يرجى تسجيل الدخول مرة أخرى.'
    : 'Authentication failed. Please log in again.'
);
