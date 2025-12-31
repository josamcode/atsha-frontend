import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Select from '../../components/Common/Select';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaArrowLeft,
  FaFileAlt,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEyeSlash,
  FaPalette,
  FaCog,
  FaGripVertical,
  FaCopy,
  FaEdit,
  FaTimes,
  FaCheck,
  FaImage,
  FaFont,
  FaBorderStyle,
  FaBeer,
  FaTable,
  FaColumns,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaRuler,
  FaExpand,
  FaCompress,
  FaQrcode,
  FaPhone,
  FaMagic,
  FaDownload
} from 'react-icons/fa';

// Ready-made Templates Library
const readyMadeTemplates = {
  menuRecipe: {
    id: 'menu-recipe',
    name: { en: 'Menu Items Recipe/Costing Sheet', ar: 'رسبي أصناف المنيو' },
    description: { en: 'Template for tracking menu item ingredients, quantities, costs, and values', ar: 'نموذج لتتبع مكونات أصناف المنيو والكميات والتكاليف والقيم' },
    template: {
      title: { en: 'Menu Items Recipe', ar: 'رسبي أصناف المنيو' },
      description: { en: 'Recipe and costing sheet for menu items', ar: 'ورقة الوصفة والتكلفة لأصناف المنيو' },
      sections: [
        {
          id: 'header_section',
          label: { en: 'Header', ar: 'الرأسية' },
          sectionType: 'header',
          fields: [],
          order: 0,
          visible: true,
          advancedLayout: {
            layoutType: 'simple',
            table: { enabled: false }
          }
        },
        {
          id: 'ingredients_table',
          label: { en: 'Ingredients Table', ar: 'جدول المكونات' },
          sectionType: 'normal',
          fields: [],
          order: 1,
          visible: true,
          advancedLayout: {
            layoutType: 'table',
            table: {
              enabled: true,
              columns: [
                { id: 'col1', label: { en: 'Ingredients', ar: 'المكونات' }, fieldKey: '', width: 'auto', alignment: 'right', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col2', label: { en: 'Unit', ar: 'الوحده' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col3', label: { en: 'Quantity', ar: 'الكميه' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col4', label: { en: 'Cost', ar: 'التكلفه' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col5', label: { en: 'Value', ar: 'القيمه' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } }
              ],
              numberOfRows: 12,
              dynamicRows: false,
              showHeader: true,
              showBorders: true,
              borderStyle: 'solid',
              borderColor: '#d4b900',
              borderWidth: 2,
              stripedRows: false,
              headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true },
              cellStyle: { backgroundColor: '#ffffff', textColor: '#000000', fontSize: 16 }
            }
          }
        },
        {
          id: 'footer_section',
          label: { en: 'Footer', ar: 'التذييل' },
          sectionType: 'footer',
          fields: [],
          order: 2,
          visible: true,
          advancedLayout: {
            layoutType: 'simple',
            table: { enabled: false }
          }
        }
      ],
      layout: {
        sectionOrder: [],
        pageSize: 'A4',
        orientation: 'portrait',
        margins: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        }
      },
      pdfStyle: {
        branding: {
          primaryColor: '#d4b900',
          secondaryColor: '#b51c20',
          logoUrl: '',
          companyName: { en: 'Atsha', ar: 'اتشا' }
        },
        header: {
          enabled: true,
          showLogo: true,
          showTitle: true,
          showSubtitle: true,
          subtitle: { en: 'Menu Items Recipe', ar: 'رسبي أصناف المنيو' },
          showDate: true,
          logoPosition: 'right',
          titleStyle: 'decorative',
          decorativeLineColor: '#d4b900',
          height: 100,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          titleColor: '#d4b900',
          fontSize: 18,
          dashedBorder: true
        },
        footer: {
          enabled: true,
          showPageNumbers: false,
          showCompanyInfo: true,
          showQRCode: true,
          showPhoneNumber: true,
          showSocialIcons: true,
          qrCodePosition: 'center',
          phoneNumber: '0539313030',
          companyName: 'atsha',
          height: 60,
          backgroundColor: '#d4b900',
          textColor: '#ffffff',
          fontSize: 10
        }
      }
    }
  },
  oilChangeLog: {
    id: 'oil-change-log',
    name: { en: 'Oil Change Log', ar: 'سجل تغيير الزيت بالمطعم' },
    description: { en: 'Template for tracking oil changes in restaurant fryers', ar: 'نموذج لتتبع تغيير الزيت في قلايات المطعم' },
    template: {
      title: { en: 'Oil Change Log in the Restaurant', ar: 'سجل تغيير الزيت بالمطعم' },
      description: { en: 'Log for tracking oil changes in fryers', ar: 'سجل لتتبع تغيير الزيت في القلايات' },
      sections: [
        {
          id: 'header_section',
          label: { en: 'Header', ar: 'الرأسية' },
          sectionType: 'header',
          fields: [],
          order: 0,
          visible: true,
          advancedLayout: { layoutType: 'simple', table: { enabled: false } }
        },
        {
          id: 'oil_change_table',
          label: { en: 'Oil Change Records', ar: 'سجل تغيير الزيت' },
          sectionType: 'normal',
          fields: [],
          order: 1,
          visible: true,
          advancedLayout: {
            layoutType: 'table',
            table: {
              enabled: true,
              columns: [
                { id: 'col1', label: { en: 'Date', ar: 'التاريخ' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col2', label: { en: 'Time', ar: 'الوقت' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col3', label: { en: 'Fryer Name', ar: 'اسم الفرير' }, fieldKey: '', width: 'auto', alignment: 'right', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col4', label: { en: 'Quantity', ar: 'الكميه' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col5', label: { en: 'Color', ar: 'اللون' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col6', label: { en: 'Odor', ar: 'الرائحه' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col7', label: { en: 'Quality', ar: 'الجوده' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col8', label: { en: 'Max Usage', ar: 'الحد الأقصى للاستخدام' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } }
              ],
              numberOfRows: 25,
              dynamicRows: false,
              showHeader: true,
              showBorders: true,
              borderStyle: 'solid',
              borderColor: '#000000',
              borderWidth: 1,
              stripedRows: false,
              headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true },
              cellStyle: { backgroundColor: '#ffffff', textColor: '#000000', fontSize: 16 }
            }
          }
        },
        {
          id: 'approval_section',
          label: { en: 'Approval', ar: 'الاعتماد' },
          sectionType: 'signature',
          fields: [
            { key: 'general_chef', label: { en: 'General Chef', ar: 'الشيف العمومي' }, type: 'text', required: false, order: 0, width: 'half' },
            { key: 'financial_mgmt', label: { en: 'Financial Management', ar: 'الادارة الماليه' }, type: 'text', required: false, order: 1, width: 'half' }
          ],
          order: 2,
          visible: true,
          advancedLayout: { layoutType: 'columns', columns: { enabled: true, columnCount: 2, equalWidths: true } }
        }
      ],
      layout: {
        sectionOrder: [],
        pageSize: 'A4',
        orientation: 'portrait',
        margins: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        }
      },
      pdfStyle: {
        branding: {
          primaryColor: '#d4b900',
          secondaryColor: '#b51c20',
          logoUrl: '',
          companyName: { en: 'Atsha', ar: 'اتشا' }
        },
        header: {
          enabled: true,
          showLogo: true,
          showTitle: true,
          showSubtitle: false,
          showDate: false,
          logoPosition: 'right',
          titleStyle: 'normal',
          height: 80,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          titleColor: '#000000',
          fontSize: 16
        },
        footer: {
          enabled: false
        }
      }
    }
  },
  wastageSheet: {
    id: 'wastage-sheet',
    name: { en: 'Wastage/Damage Sheet', ar: 'ورقه الهالك' },
    description: { en: 'Template for recording damaged or wasted items', ar: 'نموذج لتسجيل الأصناف التالفة أو المهدرة' },
    template: {
      title: { en: 'Wastage/Damage Sheet', ar: 'ورقه الهالك' },
      description: { en: 'Sheet for recording wastage and damage', ar: 'ورقة لتسجيل الهالك والضرر' },
      sections: [
        {
          id: 'header_section',
          label: { en: 'Header', ar: 'الرأسية' },
          sectionType: 'header',
          fields: [],
          order: 0,
          visible: true,
          advancedLayout: { layoutType: 'simple', table: { enabled: false } }
        },
        {
          id: 'wastage_table',
          label: { en: 'Wastage Records', ar: 'سجل الهالك' },
          sectionType: 'normal',
          fields: [],
          order: 1,
          visible: true,
          advancedLayout: {
            layoutType: 'table',
            table: {
              enabled: true,
              columns: [
                { id: 'col1', label: { en: 'Date', ar: 'التاريخ' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col2', label: { en: 'Item Name', ar: 'اسم الصنف' }, fieldKey: '', width: 'auto', alignment: 'right', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col3', label: { en: 'Unit', ar: 'الوحده' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col4', label: { en: 'Quantity', ar: 'الكميه' }, fieldKey: '', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } },
                { id: 'col5', label: { en: 'Reason', ar: 'السبب' }, fieldKey: '', width: 'auto', alignment: 'right', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true } }
              ],
              numberOfRows: 25,
              dynamicRows: false,
              showHeader: true,
              showBorders: true,
              borderStyle: 'solid',
              borderColor: '#d4b900',
              borderWidth: 2,
              stripedRows: false,
              headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 18, bold: true },
              cellStyle: { backgroundColor: '#ffffff', textColor: '#000000', fontSize: 16 }
            }
          }
        },
        {
          id: 'approval_section',
          label: { en: 'Approval', ar: 'الاعتماد' },
          sectionType: 'signature',
          fields: [
            { key: 'general_chef', label: { en: 'General Chef', ar: 'الشيف العمومي' }, type: 'text', required: false, order: 0, width: 'half' },
            { key: 'financial_mgmt', label: { en: 'Financial Management', ar: 'الاداره الماليه' }, type: 'text', required: false, order: 1, width: 'half' }
          ],
          order: 2,
          visible: true,
          advancedLayout: { layoutType: 'columns', columns: { enabled: true, columnCount: 2, equalWidths: true } }
        }
      ],
      layout: {
        sectionOrder: [],
        pageSize: 'A4',
        orientation: 'portrait',
        margins: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        }
      },
      pdfStyle: {
        branding: {
          primaryColor: '#d4b900',
          secondaryColor: '#b51c20',
          logoUrl: '',
          companyName: { en: 'Atsha', ar: 'اتشا' }
        },
        header: {
          enabled: true,
          showLogo: true,
          showTitle: true,
          showSubtitle: false,
          showDate: false,
          logoPosition: 'right',
          titleStyle: 'normal',
          height: 80,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          titleColor: '#d4b900',
          fontSize: 18
        },
        footer: {
          enabled: false
        }
      }
    }
  },
  dailyReport: {
    id: 'daily-report',
    name: { en: 'Daily Report', ar: 'التقرير اليومي' },
    description: { en: 'Comprehensive daily operational checklist', ar: 'قائمة مراجعة يومية شاملة للعمليات' },
    template: {
      title: { en: 'Daily Report', ar: 'التقرير اليومي' },
      description: { en: 'Daily operational checklist', ar: 'قائمة مراجعة العمليات اليومية' },
      sections: [
        {
          id: 'header_info',
          label: { en: 'Report Information', ar: 'معلومات التقرير' },
          sectionType: 'normal',
          fields: [
            { key: 'date', label: { en: 'Date', ar: 'التاريخ' }, type: 'date', required: true, order: 0, width: 'quarter' },
            { key: 'day', label: { en: 'Day', ar: 'اليوم' }, type: 'text', required: false, order: 1, width: 'quarter' },
            { key: 'time', label: { en: 'Time', ar: 'الوقت' }, type: 'time', required: false, order: 2, width: 'quarter' },
            { key: 'employee_name', label: { en: 'Employee Name', ar: 'اسم الموظف' }, type: 'text', required: false, order: 3, width: 'quarter' },
            { key: 'manager_duty', label: { en: 'Manager on Duty', ar: 'المدير المناوب' }, type: 'text', required: false, order: 4, width: 'half' }
          ],
          order: 0,
          visible: true,
          advancedLayout: { layoutType: 'simple', table: { enabled: false } }
        },
        {
          id: 'employees_section',
          label: { en: 'Employees', ar: 'الموظفين' },
          sectionType: 'normal',
          fields: [
            { key: 'absent_employee', label: { en: 'Is there an absent employee - sick - leave - late - permission - fingerprint', ar: 'هل يوجد موظف غائب - مريض - إجازة - متأخر - استئذان - بصمة' }, type: 'boolean', required: false, order: 0, width: 'full' },
            { key: 'clean_clothes', label: { en: 'Clean clothes - full official uniform', ar: 'ملابس نظيفة - زي رسمي كامل' }, type: 'boolean', required: false, order: 1, width: 'full' },
            { key: 'work_card', label: { en: 'Work card - health certificate - residency - name tag', ar: 'بطاقة عمل - شهادة صحية - إقامة - بطاقة اسم' }, type: 'boolean', required: false, order: 2, width: 'full' },
            { key: 'hygiene', label: { en: 'Attention to shoe polish and personal hygiene, nail trimming', ar: 'الاهتمام بتلميع الأحذية والنظافة الشخصية وتقليم الأظافر' }, type: 'boolean', required: false, order: 3, width: 'full' },
            { key: 'appearance', label: { en: 'Attention to general appearance', ar: 'الاهتمام بالمظهر العام' }, type: 'boolean', required: false, order: 4, width: 'full' },
            { key: 'mask_cover', label: { en: 'Attention to wearing mask and head cover', ar: 'الاهتمام بارتداء القناع وغطاء الرأس' }, type: 'boolean', required: false, order: 5, width: 'full' }
          ],
          order: 1,
          visible: true,
          advancedLayout: { layoutType: 'simple', table: { enabled: false } }
        },
        {
          id: 'restaurant_section',
          label: { en: 'Restaurant', ar: 'المطعم' },
          sectionType: 'normal',
          fields: [
            { key: 'main_entrance', label: { en: 'Main Entrance - Front and back glass clean and polished', ar: 'المدخل الرئيسي - الزجاج الأمامي والخلفي نظيف ولامع' }, type: 'boolean', required: false, order: 0, width: 'full' },
            { key: 'chairs_tables', label: { en: 'Chairs & Tables - Tables, chairs clean, free of dirt, grease, and residue', ar: 'الكراسي والطاولات - الطاولات والكراسي نظيفة وخالية من الأوساخ والدهون والبقايا' }, type: 'boolean', required: false, order: 1, width: 'full' },
            { key: 'dining_area', label: { en: 'Dining Area - Ensure cleanliness of joints and tissue refilling', ar: 'صالة الطعام - التأكد من نظافة المفاصل وإعادة ملء الأنسجة' }, type: 'boolean', required: false, order: 2, width: 'full' },
            { key: 'floors', label: { en: 'Floors - Floors clean, free of food residue, dirt, and grease', ar: 'الأرضيات - الأرضيات نظيفة وخالية من بقايا الطعام والأوساخ والدهون' }, type: 'boolean', required: false, order: 3, width: 'full' }
          ],
          order: 2,
          visible: true,
          advancedLayout: { layoutType: 'simple', table: { enabled: false } }
        },
        {
          id: 'counter_section',
          label: { en: 'Counter', ar: 'الكاونتر' },
          sectionType: 'normal',
          fields: [
            { key: 'pos_machine', label: { en: 'POS machine clean, drawer open and empty', ar: 'آلة نقاط البيع نظيفة، الدرج مفتوح وفارغ' }, type: 'boolean', required: false, order: 0, width: 'full' },
            { key: 'counter_shelves', label: { en: 'Shelves under the counter clean', ar: 'الرفوف تحت العداد نظيفة' }, type: 'boolean', required: false, order: 1, width: 'full' },
            { key: 'cashier_devices', label: { en: 'Cashier devices covered and ready to receive orders', ar: 'أجهزة الصراف مغطاة وجاهزة لاستقبال الطلبات' }, type: 'boolean', required: false, order: 2, width: 'full' }
          ],
          order: 3,
          visible: true,
          advancedLayout: { layoutType: 'simple', table: { enabled: false } }
        },
        {
          id: 'kitchen_section',
          label: { en: 'Kitchen', ar: 'المطبخ' },
          sectionType: 'normal',
          fields: [
            { key: 'cooking_area', label: { en: 'Cooking Area - Oven, microwave, fryer, broiler clean', ar: 'منطقة الطهي - الفرن والمايكرويف والقلاية والشواية نظيفة' }, type: 'boolean', required: false, order: 0, width: 'full' },
            { key: 'broasted', label: { en: 'Broasted - Cut cables empty and clean', ar: 'البروستد - الكابلات المقطوعة فارغة ونظيفة' }, type: 'boolean', required: false, order: 1, width: 'full' },
            { key: 'dough_area', label: { en: 'Dough Area - Dough container and roller clean', ar: 'منطقة العجين - حاوية العجين والمدحرجة نظيفة' }, type: 'boolean', required: false, order: 2, width: 'full' },
            { key: 'kitchen_floors', label: { en: 'Kitchen Floors - Floors clean, free of food residue', ar: 'أرضيات المطبخ - الأرضيات نظيفة وخالية من بقايا الطعام' }, type: 'boolean', required: false, order: 3, width: 'full' }
          ],
          order: 4,
          visible: true,
          advancedLayout: { layoutType: 'simple', table: { enabled: false } }
        }
      ],
      layout: {
        sectionOrder: [],
        pageSize: 'A4',
        orientation: 'portrait',
        margins: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        }
      },
      pdfStyle: {
        branding: {
          primaryColor: '#d4b900',
          secondaryColor: '#b51c20',
          logoUrl: '',
          companyName: { en: 'Atsha', ar: 'اتشا' }
        },
        header: {
          enabled: true,
          showLogo: true,
          showTitle: true,
          showSubtitle: false,
          showDate: true,
          logoPosition: 'right',
          titleStyle: 'normal',
          height: 80,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          titleColor: '#000000',
          fontSize: 16
        },
        footer: {
          enabled: false
        }
      }
    }
  },
  violationForm: {
    id: 'violation-form',
    name: { en: 'Violation Form', ar: 'نموذج رصد مخالفة' },
    description: { en: 'Template for recording safety and security violations with detailed information and pledge section', ar: 'نموذج لتسجيل مخالفات الأمن والسلامة مع معلومات تفصيلية وقسم التعهد' },
    template: {
      title: { en: 'Violation Form', ar: 'نموذج رصد مخالفة' },
      description: { en: 'Form for recording violations', ar: 'نموذج لتسجيل المخالفات' },
      sections: [
        {
          id: 'header_section',
          label: { en: 'Header', ar: 'الرأسية' },
          sectionType: 'header',
          fields: [],
          order: 0,
          visible: true,
          advancedLayout: {
            layoutType: 'simple',
            table: { enabled: false }
          }
        },
        {
          id: 'basic_info_section',
          label: { en: 'Basic Information', ar: 'المعلومات الأساسية' },
          sectionType: 'normal',
          fields: [
            { key: 'time', label: { en: 'Time', ar: 'الوقت / Time' }, type: 'time', required: false, order: 0, width: 'quarter', visible: true },
            { key: 'date', label: { en: 'Date', ar: 'التاريخ / Date' }, type: 'date', required: false, order: 1, width: 'quarter', visible: true },
            { key: 'job_order', label: { en: 'Job order', ar: 'أمر عمل / Job order' }, type: 'text', required: false, order: 2, width: 'quarter', visible: true },
            { key: 'facility', label: { en: 'Facility', ar: 'أسم المنشأة / Facility' }, type: 'text', required: false, order: 3, width: 'quarter', visible: true }
          ],
          order: 1,
          visible: true,
          advancedLayout: {
            layoutType: 'table',
            table: {
              enabled: true,
              columns: [
                { id: 'col1', label: { en: 'Time', ar: 'الوقت / Time' }, fieldKey: 'time', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 16, bold: true } },
                { id: 'col2', label: { en: 'Date', ar: 'التاريخ / Date' }, fieldKey: 'date', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 16, bold: true } },
                { id: 'col3', label: { en: 'Job order', ar: 'أمر عمل / Job order' }, fieldKey: 'job_order', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 16, bold: true } },
                { id: 'col4', label: { en: 'Facility', ar: 'أسم المنشأة / Facility' }, fieldKey: 'facility', width: 'auto', alignment: 'center', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 16, bold: true } }
              ],
              numberOfRows: 1,
              dynamicRows: false,
              showHeader: true,
              showBorders: true,
              borderStyle: 'solid',
              borderColor: '#d4b900',
              borderWidth: 2,
              stripedRows: false,
              headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 16, bold: true },
              cellStyle: { backgroundColor: '#ffffff', textColor: '#000000', fontSize: 14 }
            }
          }
        },
        {
          id: 'violation_details_section',
          label: { en: 'Violation Details', ar: 'تفاصيل المخالفة / Violation Details' },
          sectionType: 'normal',
          fields: [
            { key: 'violation_description', label: { en: 'Violation Details', ar: 'تفاصيل المخالفة / Violation Details' }, type: 'textarea', required: false, order: 0, width: 'full', visible: true },
            { key: 'violation_type', label: { en: 'Type of Violation', ar: 'نوع المخالفة / Type of Violation' }, type: 'text', required: false, order: 1, width: 'full', visible: true },
            { key: 'location', label: { en: 'Location', ar: 'الموقع / Location' }, type: 'text', required: false, order: 2, width: 'full', visible: true },
            { key: 'violator_name', label: { en: 'Violator Name', ar: 'اسم المخالف / Violator Name' }, type: 'text', required: false, order: 3, width: 'full', visible: true },
            { key: 'work_id_id_no', label: { en: 'Work Id - Id No', ar: 'الرقم الوظيفي - رقم الهوية / Work Id - Id No' }, type: 'text', required: false, order: 4, width: 'full', visible: true },
            { key: 'job_title', label: { en: 'Job title', ar: 'المسمى الوظيفي / Job title' }, type: 'text', required: false, order: 5, width: 'full', visible: true },
            { key: 'contact_no', label: { en: 'Contact No.', ar: 'رقم التواصل / Contact No.' }, type: 'text', required: false, order: 6, width: 'full', visible: true },
            { key: 'violator_signature', label: { en: 'Signature', ar: 'التوقيع / Signature' }, type: 'text', required: false, order: 7, width: 'full', visible: true }
          ],
          order: 2,
          visible: true,
          advancedLayout: {
            layoutType: 'table',
            table: {
              enabled: true,
              columns: [
                { id: 'col1', label: { en: 'Field', ar: 'الحقل' }, fieldKey: '', width: 'auto', alignment: 'right', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 16, bold: true } },
                { id: 'col2', label: { en: 'Value', ar: 'القيمة' }, fieldKey: '', width: 'auto', alignment: 'right', headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 16, bold: true } }
              ],
              numberOfRows: 8,
              dynamicRows: false,
              showHeader: true,
              showBorders: true,
              borderStyle: 'solid',
              borderColor: '#d4b900',
              borderWidth: 2,
              stripedRows: false,
              headerStyle: { backgroundColor: '#d4b900', textColor: '#ffffff', fontSize: 16, bold: true },
              cellStyle: { backgroundColor: '#ffffff', textColor: '#000000', fontSize: 14 }
            }
          }
        },
        {
          id: 'pledge_section',
          label: { en: 'Pledge', ar: 'تعهد / Pledge' },
          sectionType: 'normal',
          fields: [
            { key: 'pledge_static_text', label: { en: 'Pledge Text', ar: 'نص التعهد' }, type: 'textarea', required: false, order: 0, width: 'full', visible: true, defaultValue: { en: 'I, [name] acknowledge that I have committed a violation as described above. I understand the rules and regulations of the Associate Executive Administration of Safety and Security and I am responsible for my actions. I agree to follow the corrective action plan and undertake not to repeat the violation again.', ar: 'أقر أنا، [الاسم] بأنني قد ارتكبت مخالفة على النحو المبين أعلاه، أفهم قواعد ولوائح الإدارة التنفيذية المشاركة للأمن والسلامة، وأني اتحمل مسؤولية أفعالي وأوافق على اتباع خطة العمل التصحيحية وأتعهد بعدم تكرار المخالفة مرة أخرى.' }, pdfDisplay: { showLabel: false, showValue: true } },
            { key: 'pledge_name', label: { en: 'Name', ar: 'الاسم / Name' }, type: 'text', required: false, order: 1, width: 'full', visible: true },
            { key: 'pledge_signature', label: { en: 'Signature', ar: 'التوقيع / Signature' }, type: 'text', required: false, order: 2, width: 'full', visible: true }
          ],
          order: 3,
          visible: true,
          advancedLayout: {
            layoutType: 'simple',
            table: { enabled: false }
          }
        },
        {
          id: 'approval_signatures_section',
          label: { en: 'Approval Signatures', ar: 'التوقيعات والموافقات' },
          sectionType: 'normal',
          fields: [
            { key: 'phc_director_name', label: { en: 'PHC Director - Name', ar: 'مدير مركز الرعاية الصحية الأولية - اسم / PHC Director - Name' }, type: 'text', required: false, order: 0, width: 'half', visible: true },
            { key: 'phc_director_work_id', label: { en: 'PHC Director - Work Id No', ar: 'مدير مركز الرعاية الصحية الأولية - الرقم الوظيفي / PHC Director - Work Id No' }, type: 'text', required: false, order: 1, width: 'half', visible: true },
            { key: 'phc_director_signature', label: { en: 'PHC Director - Signature', ar: 'مدير مركز الرعاية الصحية الأولية - توقيع / PHC Director - Signature' }, type: 'text', required: false, order: 2, width: 'half', visible: true },
            { key: 'security_personnel_name', label: { en: 'Security Personnel - Name', ar: 'خاص بمسؤول الأمن - اسم / For Security Personnel - Name' }, type: 'text', required: false, order: 3, width: 'half', visible: true },
            { key: 'security_personnel_work_id', label: { en: 'Security Personnel - Work Id No', ar: 'خاص بمسؤول الأمن - الرقم الوظيفي / For Security Personnel - Work Id No' }, type: 'text', required: false, order: 4, width: 'half', visible: true },
            { key: 'security_personnel_signature', label: { en: 'Security Personnel - Signature', ar: 'خاص بمسؤول الأمن - توقيع / For Security Personnel - Signature' }, type: 'text', required: false, order: 5, width: 'half', visible: true }
          ],
          order: 4,
          visible: true,
          advancedLayout: {
            layoutType: 'simple',
            table: { enabled: false }
          }
        },
        {
          id: 'footer_section',
          label: { en: 'Footer', ar: 'التذييل' },
          sectionType: 'footer',
          fields: [],
          order: 5,
          visible: true,
          advancedLayout: {
            layoutType: 'simple',
            table: { enabled: false }
          }
        }
      ],
      layout: {
        sectionOrder: [],
        pageSize: 'A4',
        orientation: 'portrait',
        margins: {
          top: 75,
          right: 75,
          bottom: 75,
          left: 75
        }
      },
      pdfStyle: {
        branding: {
          primaryColor: '#d4b900',
          secondaryColor: '#b51c20',
          logoUrl: '',
          companyName: { en: 'Atsha', ar: 'اتشا' }
        },
        header: {
          enabled: true,
          showLogo: true,
          showTitle: true,
          showSubtitle: true,
          subtitle: { en: 'Associate Executive Administration for Safety and Security', ar: 'الإدارة التنفيذية والمشاركة للأمن والسلامة' },
          showDate: false,
          logoPosition: 'right',
          titleStyle: 'normal',
          height: 120,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          titleColor: '#000000',
          fontSize: 22,
          dashedBorder: false
        },
        footer: {
          enabled: true,
          showPageNumbers: false,
          showCompanyInfo: false,
          showQRCode: false,
          showPhoneNumber: false,
          showSocialIcons: false,
          height: 100,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          fontSize: 10
        }
      }
    }
  }
};

// Intelligent Recommendation Engine
const getRecommendations = (formData) => {
  const recommendations = [];
  const title = (formData.title?.en || formData.title?.ar || '').toLowerCase();
  const description = (formData.description?.en || formData.description?.ar || '').toLowerCase();
  const allText = `${title} ${description}`;

  // Analyze template type
  const isRecipe = allText.includes('recipe') || allText.includes('menu') || allText.includes('ingredient') || allText.includes('costing');
  const isLog = allText.includes('log') || allText.includes('record') || allText.includes('track');
  const isReport = allText.includes('report') || allText.includes('daily') || allText.includes('checklist');
  const isWastage = allText.includes('wastage') || allText.includes('waste') || allText.includes('damage');
  const isOilChange = allText.includes('oil') || allText.includes('fryer');
  const isInventory = allText.includes('inventory') || allText.includes('stock') || allText.includes('item');
  const isForm = allText.includes('form') || allText.includes('application') || allText.includes('request');

  // Count fields across all sections
  const totalFields = formData.sections.reduce((sum, section) => sum + (section.fields?.length || 0), 0);
  const hasMultipleSections = formData.sections.length > 1;
  const hasManyFields = totalFields >= 5;

  // Layout Recommendations
  if (isRecipe || isInventory || (hasManyFields && !isForm)) {
    recommendations.push({
      type: 'layout',
      priority: 'high',
      title: { en: 'Use Table Layout', ar: 'استخدم تخطيط الجدول' },
      description: {
        en: 'Tables work great for recipes and inventory with multiple items. Convert your section to a table layout.',
        ar: 'الجداول تعمل بشكل رائع للوصفات والمخزون مع عناصر متعددة. قم بتحويل قسمك إلى تخطيط جدول.'
      },
      action: () => {
        const updatedSections = formData.sections.map((section, idx) => {
          if (section.fields.length >= 3) {
            const columns = section.fields.slice(0, 5).map((field, fIdx) => ({
              id: `col_${fIdx}`,
              label: field.label || { en: `Column ${fIdx + 1}`, ar: `عمود ${fIdx + 1}` },
              fieldKey: field.key,
              width: 'auto',
              alignment: 'center',
              headerStyle: {
                backgroundColor: '#d4b900',
                textColor: '#ffffff',
                fontSize: 16,
                bold: true
              }
            }));

            return {
              ...section,
              advancedLayout: {
                ...section.advancedLayout,
                layoutType: 'table',
                table: {
                  enabled: true,
                  columns: columns,
                  numberOfRows: 10,
                  dynamicRows: false,
                  showHeader: true,
                  showBorders: true,
                  borderStyle: 'solid',
                  borderColor: '#d4b900',
                  borderWidth: 2,
                  stripedRows: false,
                  headerStyle: {
                    backgroundColor: '#d4b900',
                    textColor: '#ffffff',
                    fontSize: 16,
                    bold: true
                  },
                  cellStyle: {
                    backgroundColor: '#ffffff',
                    textColor: '#000000',
                    fontSize: 11
                  }
                }
              }
            };
          }
          return section;
        });
        return { ...formData, sections: updatedSections };
      }
    });
  }

  if (isForm || (!hasManyFields && totalFields > 0)) {
    recommendations.push({
      type: 'layout',
      priority: 'medium',
      title: { en: 'Use Column Layout', ar: 'استخدم تخطيط الأعمدة' },
      description: {
        en: 'Two-column layout works well for forms with multiple fields. Organize fields in columns.',
        ar: 'تخطيط عمودين يعمل بشكل جيد للنماذج مع حقول متعددة. نظم الحقول في أعمدة.'
      },
      action: () => {
        const updatedSections = formData.sections.map((section) => ({
          ...section,
          advancedLayout: {
            ...section.advancedLayout,
            layoutType: 'columns',
            columns: {
              enabled: true,
              columnCount: 2,
              columnGap: 20,
              equalWidths: true
            }
          }
        }));
        return { ...formData, sections: updatedSections };
      }
    });
  }

  // Color Scheme Recommendations
  if (isRecipe || isLog || isReport) {
    recommendations.push({
      type: 'styling',
      priority: 'high',
      title: { en: 'Apply Professional Red Theme', ar: 'تطبيق سمة حمراء احترافية' },
      description: {
        en: 'Use the company red color scheme (#d4b900) for headers and borders to match your brand.',
        ar: 'استخدم مخطط الألوان الأحمر للشركة (#d4b900) للرؤوس والحدود لتطابق علامتك التجارية.'
      },
      action: () => ({
        ...formData,
        pdfStyle: {
          ...formData.pdfStyle,
          branding: {
            ...formData.pdfStyle.branding,
            primaryColor: '#d4b900',
            secondaryColor: '#b51c20'
          },
          header: {
            ...formData.pdfStyle.header,
            titleColor: '#d4b900',
            decorativeLineColor: '#d4b900',
            titleStyle: isReport ? 'decorative' : 'normal'
          },
          footer: {
            ...formData.pdfStyle.footer,
            backgroundColor: '#d4b900',
            textColor: '#ffffff',
            enabled: true,
            showCompanyInfo: true
          }
        }
      })
    });
  }

  // Header Recommendations
  if (isReport || isLog) {
    recommendations.push({
      type: 'styling',
      priority: 'medium',
      title: { en: 'Enable Decorative Header', ar: 'تفعيل رأسية زخرفية' },
      description: {
        en: 'Add a decorative header with lines and date for professional reports.',
        ar: 'أضف رأسية زخرفية مع خطوط وتاريخ للتقارير الاحترافية.'
      },
      action: () => ({
        ...formData,
        pdfStyle: {
          ...formData.pdfStyle,
          header: {
            ...formData.pdfStyle.header,
            enabled: true,
            showLogo: true,
            showTitle: true,
            showSubtitle: true,
            showDate: true,
            titleStyle: 'decorative',
            decorativeLineColor: '#d4b900',
            titleColor: '#d4b900',
            logoPosition: 'right'
          }
        }
      })
    });
  }

  // Footer Recommendations
  if (isReport || isLog || isForm) {
    recommendations.push({
      type: 'styling',
      priority: 'medium',
      title: { en: 'Add Professional Footer', ar: 'إضافة تذييل احترافي' },
      description: {
        en: 'Enable footer with company info, QR code, and contact details.',
        ar: 'تفعيل التذييل مع معلومات الشركة ورمز QR وتفاصيل الاتصال.'
      },
      action: () => ({
        ...formData,
        pdfStyle: {
          ...formData.pdfStyle,
          footer: {
            ...formData.pdfStyle.footer,
            enabled: true,
            showCompanyInfo: true,
            showQRCode: true,
            showPhoneNumber: true,
            showSocialIcons: true,
            backgroundColor: '#d4b900',
            textColor: '#ffffff',
            qrCodePosition: 'center',
            phoneNumber: '0539313030',
            companyName: 'atsha'
          }
        }
      })
    });
  }

  // Section Type Recommendations
  if (isReport && hasMultipleSections) {
    recommendations.push({
      type: 'structure',
      priority: 'low',
      title: { en: 'Add Signature Section', ar: 'إضافة قسم التوقيع' },
      description: {
        en: 'Add an approval/signature section at the end for reports that require authorization.',
        ar: 'أضف قسم الموافقة/التوقيع في النهاية للتقارير التي تتطلب التفويض.'
      },
      action: () => {
        const newSection = {
          id: `section_${Date.now()}`,
          label: { en: 'Approval', ar: 'الاعتماد' },
          sectionType: 'signature',
          fields: [
            {
              key: 'signature_1',
              label: { en: 'Signature 1', ar: 'التوقيع 1' },
              type: 'text',
              required: false,
              order: 0,
              width: 'half'
            },
            {
              key: 'signature_2',
              label: { en: 'Signature 2', ar: 'التوقيع 2' },
              type: 'text',
              required: false,
              order: 1,
              width: 'half'
            }
          ],
          order: formData.sections.length,
          visible: true,
          advancedLayout: {
            layoutType: 'columns',
            columns: {
              enabled: true,
              columnCount: 2,
              equalWidths: true
            }
          }
        };
        return { ...formData, sections: [...formData.sections, newSection] };
      }
    });
  }

  // Field Type Recommendations
  if (hasManyFields && formData.sections.some(s => s.fields.length > 0)) {
    const sectionWithFields = formData.sections.find(s => s.fields.length > 0);
    if (sectionWithFields) {
      const hasNumericFields = sectionWithFields.fields.some(f =>
        f.type === 'number' || f.label?.en?.toLowerCase().includes('quantity') ||
        f.label?.en?.toLowerCase().includes('cost') || f.label?.en?.toLowerCase().includes('price')
      );

      if (hasNumericFields) {
        recommendations.push({
          type: 'structure',
          priority: 'medium',
          title: { en: 'Add Totals Row', ar: 'إضافة صف الإجمالي' },
          description: {
            en: 'Consider adding a totals section for numeric fields like costs and quantities.',
            ar: 'فكر في إضافة قسم الإجماليات للحقول الرقمية مثل التكاليف والكميات.'
          },
          action: null // Just a suggestion, no auto-action
        });
      }
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

const TemplateBuilder = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === 'ar';
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState('structure'); // structure, layout, styling, preview
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    description: { en: '', ar: '' },
    sections: [],
    visibleToRoles: ['admin', 'supervisor', 'employee'],
    editableByRoles: ['admin', 'supervisor', 'employee'],
    departments: ['all'],
    templateDepartment: 'all', // The department this template belongs to
    requiresApproval: true,
    // Layout configuration
    layout: {
      sectionOrder: [],
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      }
    },
    // PDF styling
    pdfStyle: {
      branding: {
        primaryColor: '#d4b900',
        secondaryColor: '#b51c20',
        logoUrl: '',
        companyName: { en: 'Atsha', ar: 'اتشا' }
      },
      header: {
        enabled: true,
        showLogo: true,
        showTitle: true,
        showSubtitle: false,
        showDate: true,
        showCompanyName: true,
        showCompanyAddress: true,
        layout: 'default', // 'default' or 'split'
        logoPosition: 'right', // 'left', 'center', 'right'
        titleStyle: 'normal', // 'normal', 'decorative' (with lines on sides)
        subtitle: { en: '', ar: '' },
        decorativeLineColor: '#d4b900',
        height: 80,
        backgroundColor: '#ffffff',
        textColor: '#000000',
        titleColor: '#d4b900', // Red title like in images
        fontSize: 16,
        dashedBorder: false, // Dashed border around document
        border: {
          show: true,
          width: 4,
          style: 'solid',
          color: '#d4b900',
          position: 'bottom'
        }
      },
      footer: {
        enabled: true,
        showPageNumbers: true,
        showCompanyInfo: true,
        showQRCode: false,
        showPhoneNumber: false,
        showSocialIcons: false,
        qrCodePosition: 'center', // 'left', 'center', 'right'
        phoneNumber: '',
        companyName: 'atsha',
        socialIcons: [],
        height: 50,
        backgroundColor: '#d4b900', // Red footer like in images
        textColor: '#ffffff',
        fontSize: 14,
        content: { en: '', ar: '' }
      },
      metadata: {
        enabled: true,
        showFormId: true,
        showDate: true,
        showShift: true,
        showDepartment: true,
        showFilledBy: true,
        showSubmittedOn: true,
        showApprovedBy: true,
        showApprovalDate: true
      },
      branding: {
        primaryColor: '#d4b900',
        secondaryColor: '#b51c20',
        logoUrl: '',
        companyName: { en: 'atsha', ar: 'اتشا' },
        companyAddress: { en: '', ar: '' },
        companyPhone: '',
        companyEmail: ''
      },
      fontFamily: 'Helvetica',
      fontSize: {
        title: 24,
        section: 20,
        field: 16
      },
      colors: {
        primary: '#d4b900',
        text: '#000000',
        border: '#e5e7eb',
        background: '#ffffff'
      },
      spacing: {
        sectionSpacing: 20,
        fieldSpacing: 10,
        lineSpacing: 1.2
      }
    }
  });

  const fieldTypes = useMemo(() => [
    { value: 'text', label: t('templates.fieldTypes.text'), labelAr: t('templates.fieldTypes.text', { lng: 'ar' }) },
    { value: 'textarea', label: t('templates.fieldTypes.textarea'), labelAr: t('templates.fieldTypes.textarea', { lng: 'ar' }) },
    { value: 'number', label: t('templates.fieldTypes.number'), labelAr: t('templates.fieldTypes.number', { lng: 'ar' }) },
    { value: 'boolean', label: t('templates.fieldTypes.boolean'), labelAr: t('templates.fieldTypes.boolean', { lng: 'ar' }) },
    { value: 'select', label: t('templates.fieldTypes.select'), labelAr: t('templates.fieldTypes.select', { lng: 'ar' }) },
    { value: 'date', label: t('templates.fieldTypes.date'), labelAr: t('templates.fieldTypes.date', { lng: 'ar' }) },
    { value: 'time', label: t('templates.fieldTypes.time'), labelAr: t('templates.fieldTypes.time', { lng: 'ar' }) },
    { value: 'datetime', label: t('templates.fieldTypes.datetime'), labelAr: t('templates.fieldTypes.datetime', { lng: 'ar' }) },
    { value: 'file', label: t('templates.fieldTypes.file'), labelAr: t('templates.fieldTypes.file', { lng: 'ar' }) }
  ], [t, i18n.language]);

  const sectionTypes = useMemo(() => [
    { value: 'normal', label: t('templates.sectionTypes.normal'), labelAr: t('templates.sectionTypes.normal', { lng: 'ar' }) },
    { value: 'header', label: t('templates.sectionTypes.header'), labelAr: t('templates.sectionTypes.header', { lng: 'ar' }) },
    { value: 'footer', label: t('templates.sectionTypes.footer'), labelAr: t('templates.sectionTypes.footer', { lng: 'ar' }) },
    { value: 'signature', label: t('templates.sectionTypes.signature'), labelAr: t('templates.sectionTypes.signature', { lng: 'ar' }) },
    { value: 'approval', label: t('templates.sectionTypes.approval'), labelAr: t('templates.sectionTypes.approval', { lng: 'ar' }) },
    { value: 'stamp', label: t('templates.sectionTypes.stamp'), labelAr: t('templates.sectionTypes.stamp', { lng: 'ar' }) },
    { value: 'totals', label: t('templates.sectionTypes.totals'), labelAr: t('templates.sectionTypes.totals', { lng: 'ar' }) },
    { value: 'notes', label: t('templates.sectionTypes.notes'), labelAr: t('templates.sectionTypes.notes', { lng: 'ar' }) }
  ], [t, i18n.language]);

  const widthOptions = useMemo(() => [
    { value: 'full', label: t('templates.widthOptions.full'), labelAr: t('templates.widthOptions.full', { lng: 'ar' }) },
    { value: 'half', label: t('templates.widthOptions.half'), labelAr: t('templates.widthOptions.half', { lng: 'ar' }) },
    { value: 'third', label: t('templates.widthOptions.third'), labelAr: t('templates.widthOptions.third', { lng: 'ar' }) },
    { value: 'two-thirds', label: t('templates.widthOptions.two-thirds'), labelAr: t('templates.widthOptions.two-thirds', { lng: 'ar' }) },
    { value: 'quarter', label: t('templates.widthOptions.quarter'), labelAr: t('templates.widthOptions.quarter', { lng: 'ar' }) },
    { value: 'three-quarters', label: t('templates.widthOptions.three-quarters'), labelAr: t('templates.widthOptions.three-quarters', { lng: 'ar' }) }
  ], [t, i18n.language]);

  // Update recommendations when formData changes
  useEffect(() => {
    if (formData.title?.en || formData.title?.ar || formData.sections.length > 0) {
      const newRecommendations = getRecommendations(formData);
      setRecommendations(newRecommendations);
    } else {
      setRecommendations([]);
    }
  }, [formData]);

  useEffect(() => {
    if (isEditMode) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const response = await api.get(`/form-templates/${id}`);
      const template = response.data.data;

      // Initialize advancedLayout for each section if missing
      const sectionsWithAdvancedLayout = template.sections.map(section => {
        if (!section.advancedLayout) {
          return {
            ...section,
            advancedLayout: {
              layoutType: 'simple',
              table: {
                enabled: false,
                columns: [],
                dynamicRows: false,
                rowSource: '',
                numberOfRows: 10, // Number of empty rows for data entry
                showHeader: true,
                showBorders: true,
                borderStyle: 'solid', // 'solid', 'dashed', 'dotted'
                borderColor: '#e5e7eb',
                borderWidth: 1,
                stripedRows: false,
                headerStyle: {
                  backgroundColor: '#f3f4f6',
                  textColor: '#000000',
                  fontSize: 18,
                  bold: true
                },
                cellStyle: {
                  backgroundColor: '#ffffff',
                  textColor: '#000000',
                  fontSize: 16
                }
              },
              columns: {
                enabled: false,
                columnCount: 2,
                columnGap: 20,
                columnWidths: [],
                equalWidths: true
              },
              grid: {
                enabled: false,
                rows: 1,
                columns: 1,
                gap: 10,
                template: ''
              },
              spacing: {
                sectionSpacing: 20,
                fieldSpacing: 10,
                lineSpacing: 1.2
              },
              sizing: {
                width: '100%',
                maxWidth: '100%',
                minWidth: 'auto',
                height: 'auto',
                maxHeight: 'auto',
                minHeight: 'auto'
              },
              padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
              },
              margins: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
              },
              styling: {
                titleColor: '#000000',
                titleFontSize: 20,
                showTitle: true,
                backgroundColor: '#ffffff',
                textColor: '#000000',
                borderColor: '#e5e7eb'
              }
            }
          };
        } else {
          // Ensure styling object exists
          if (!section.advancedLayout.styling) {
            section.advancedLayout.styling = {
              titleColor: '#000000',
              titleFontSize: 20,
              showTitle: true,
              backgroundColor: '#ffffff',
              textColor: '#000000',
              borderColor: '#e5e7eb'
            };
          } else {
            // Don't override showTitle if it exists - preserve the saved value
            // Only set default if it's completely missing (handled above)
          }
          // Ensure table headerStyle and cellStyle exist
          if (section.advancedLayout.table && !section.advancedLayout.table.headerStyle) {
            section.advancedLayout.table.headerStyle = {
              backgroundColor: '#f3f4f6',
              textColor: '#000000',
              fontSize: 18
            };
          }
          if (section.advancedLayout.table && !section.advancedLayout.table.cellStyle) {
            section.advancedLayout.table.cellStyle = {
              backgroundColor: '#ffffff',
              textColor: '#000000',
              fontSize: 16
            };
          }
          // Ensure each column has fieldType
          if (section.advancedLayout.table && section.advancedLayout.table.columns) {
            section.advancedLayout.table.columns = section.advancedLayout.table.columns.map(col => {
              // Debug: Log column data when loading
              if (process.env.NODE_ENV === 'development') {
                console.log(`[TemplateBuilder] Loading column:`, {
                  id: col.id,
                  label: col.label,
                  fieldType: col.fieldType,
                  hasFieldType: col.fieldType !== undefined && col.fieldType !== null
                });
              }
              return {
                ...col,
                fieldType: col.fieldType || 'text' // Default to 'text' if missing
              };
            });
          }
          // Ensure layout type and enabled flags are in sync
          const layoutType = section.advancedLayout.layoutType || 'simple';
          if (layoutType === 'table' && !section.advancedLayout.table?.enabled) {
            section.advancedLayout.table = {
              ...section.advancedLayout.table,
              enabled: true
            };
          } else if (layoutType === 'columns' && !section.advancedLayout.columns?.enabled) {
            section.advancedLayout.columns = {
              ...section.advancedLayout.columns,
              enabled: true
            };
          } else if (layoutType === 'grid' && !section.advancedLayout.grid?.enabled) {
            section.advancedLayout.grid = {
              ...section.advancedLayout.grid,
              enabled: true
            };
          }
        }
        return section;
      });

      // Determine templateDepartment from departments array
      // If departments contains 'all', set to 'all', otherwise use the first department
      const templateDepartment = template.departments && template.departments.length > 0
        ? (template.departments.includes('all') ? 'all' : template.departments[0])
        : 'all';

      // Merge with defaults to ensure all fields exist
      setFormData({
        ...formData,
        ...template,
        templateDepartment: templateDepartment,
        sections: sectionsWithAdvancedLayout,
        layout: {
          ...formData.layout,
          ...(template.layout || {})
        },
        pdfStyle: {
          ...formData.pdfStyle,
          ...(template.pdfStyle || {}),
          metadata: template.pdfStyle?.metadata ? {
            enabled: template.pdfStyle.metadata.enabled !== false,
            showFormId: template.pdfStyle.metadata.showFormId !== false,
            showDate: template.pdfStyle.metadata.showDate !== false,
            showShift: template.pdfStyle.metadata.showShift !== false,
            showDepartment: template.pdfStyle.metadata.showDepartment !== false,
            showFilledBy: template.pdfStyle.metadata.showFilledBy !== false,
            showSubmittedOn: template.pdfStyle.metadata.showSubmittedOn !== false,
            showApprovedBy: template.pdfStyle.metadata.showApprovedBy !== false,
            showApprovalDate: template.pdfStyle.metadata.showApprovalDate !== false
          } : {
            enabled: true,
            showFormId: true,
            showDate: true,
            showShift: true,
            showDepartment: true,
            showFilledBy: true,
            showSubmittedOn: true,
            showApprovedBy: true,
            showApprovalDate: true
          }
        }
      });

      // Initialize section order if not present
      if (!template.layout?.sectionOrder || template.layout.sectionOrder.length === 0) {
        const sectionOrder = sectionsWithAdvancedLayout.map(s => s.id);
        setFormData(prev => ({
          ...prev,
          layout: {
            ...prev.layout,
            sectionOrder
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      showError(t('templates.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      label: { en: '', ar: '' },
      fields: [],
      order: formData.sections.length,
      visible: true,
      sectionType: 'normal',
      pdfStyle: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        showBorder: true,
        showBackground: false
      },
      advancedLayout: {
        layoutType: 'simple',
        table: {
          enabled: false,
          columns: [],
          dynamicRows: false,
          rowSource: '',
          showHeader: true,
          showBorders: true,
          stripedRows: false,
          headerStyle: {
            backgroundColor: '#f3f4f6',
            textColor: '#000000',
            fontSize: 18
          },
          cellStyle: {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            fontSize: 16
          }
        },
        columns: {
          enabled: false,
          columnCount: 2,
          columnGap: 20,
          columnWidths: [],
          equalWidths: true
        },
        grid: {
          enabled: false,
          rows: 1,
          columns: 1,
          gap: 10,
          template: ''
        },
        spacing: {
          sectionSpacing: 20,
          fieldSpacing: 10,
          lineSpacing: 1.2
        },
        sizing: {
          width: '100%',
          maxWidth: '100%',
          minWidth: 'auto',
          height: 'auto',
          maxHeight: 'auto',
          minHeight: 'auto'
        },
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        },
        margins: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        },
        styling: {
          titleColor: '#000000',
          titleFontSize: 20,
          showTitle: true,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          borderColor: '#e5e7eb'
        }
      }
    };

    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      layout: {
        ...prev.layout,
        sectionOrder: [...prev.layout.sectionOrder, newSection.id]
      }
    }));

    setSelectedSection(formData.sections.length);
  };

  const duplicateSection = (sectionIndex) => {
    const sectionToDuplicate = formData.sections[sectionIndex];
    const duplicatedSection = {
      ...sectionToDuplicate,
      id: `section_${Date.now()}`,
      label: {
        en: `${sectionToDuplicate.label.en} (Copy)`,
        ar: `${sectionToDuplicate.label.ar} (نسخة)`
      },
      fields: sectionToDuplicate.fields.map(field => ({
        ...field,
        key: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })),
      order: formData.sections.length
    };

    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections.slice(0, sectionIndex + 1),
        duplicatedSection,
        ...prev.sections.slice(sectionIndex + 1)
      ],
      layout: {
        ...prev.layout,
        sectionOrder: [
          ...prev.layout.sectionOrder.slice(0, sectionIndex + 1),
          duplicatedSection.id,
          ...prev.layout.sectionOrder.slice(sectionIndex + 1)
        ]
      }
    }));

    setSelectedSection(sectionIndex + 1);
  };

  const removeSection = (sectionIndex) => {
    const section = formData.sections[sectionIndex];
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sectionIndex),
      layout: {
        ...prev.layout,
        sectionOrder: prev.layout.sectionOrder.filter(id => id !== section.id)
      }
    }));

    if (selectedSection === sectionIndex) {
      setSelectedSection(null);
    } else if (selectedSection > sectionIndex) {
      setSelectedSection(selectedSection - 1);
    }
  };

  const moveSection = (sectionIndex, direction) => {
    if (
      (direction === 'up' && sectionIndex === 0) ||
      (direction === 'down' && sectionIndex === formData.sections.length - 1)
    ) {
      return;
    }

    const newSections = [...formData.sections];
    const newOrder = [...formData.layout.sectionOrder];
    const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

    // Swap sections
    [newSections[sectionIndex], newSections[targetIndex]] =
      [newSections[targetIndex], newSections[sectionIndex]];

    // Swap in order array
    const sectionId = newSections[sectionIndex].id;
    const targetId = newSections[targetIndex].id;
    const sectionOrderIndex = newOrder.indexOf(sectionId);
    const targetOrderIndex = newOrder.indexOf(targetId);
    [newOrder[sectionOrderIndex], newOrder[targetOrderIndex]] =
      [newOrder[targetOrderIndex], newOrder[sectionOrderIndex]];

    setFormData(prev => ({
      ...prev,
      sections: newSections,
      layout: {
        ...prev.layout,
        sectionOrder: newOrder
      }
    }));

    // Update selected section index
    if (selectedSection === sectionIndex) {
      setSelectedSection(targetIndex);
    } else if (selectedSection === targetIndex) {
      setSelectedSection(sectionIndex);
    }
  };

  const updateSection = (sectionIndex, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      if (field.includes('.')) {
        const parts = field.split('.');
        let obj = newSections[sectionIndex];
        for (let i = 0; i < parts.length - 1; i++) {
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
      } else {
        newSections[sectionIndex][field] = value;
      }
      return { ...prev, sections: newSections };
    });
  };

  const addField = (sectionIndex) => {
    const section = formData.sections[sectionIndex];
    const newField = {
      key: `field_${Date.now()}`,
      label: { en: '', ar: '' },
      type: 'text',
      required: false,
      placeholder: { en: '', ar: '' },
      options: [],
      order: section.fields.length,
      width: 'full',
      visible: true,
      pdfDisplay: {
        showLabel: true,
        showValue: true,
        fontSize: 16,
        bold: false
      }
    };

    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields.push(newField);
      return { ...prev, sections: newSections };
    });

    setSelectedField({ sectionIndex, fieldIndex: section.fields.length });
  };

  const duplicateField = (sectionIndex, fieldIndex) => {
    const fieldToDuplicate = formData.sections[sectionIndex].fields[fieldIndex];
    const duplicatedField = {
      ...fieldToDuplicate,
      key: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: {
        en: `${fieldToDuplicate.label.en} (Copy)`,
        ar: `${fieldToDuplicate.label.ar} (نسخة)`
      },
      order: formData.sections[sectionIndex].fields.length
    };

    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields = [
        ...newSections[sectionIndex].fields.slice(0, fieldIndex + 1),
        duplicatedField,
        ...newSections[sectionIndex].fields.slice(fieldIndex + 1)
      ];
      return { ...prev, sections: newSections };
    });

    setSelectedField({ sectionIndex, fieldIndex: fieldIndex + 1 });
  };

  const removeField = (sectionIndex, fieldIndex) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].fields = newSections[sectionIndex].fields.filter(
        (_, idx) => idx !== fieldIndex
      );
      return { ...prev, sections: newSections };
    });

    if (
      selectedField?.sectionIndex === sectionIndex &&
      selectedField?.fieldIndex === fieldIndex
    ) {
      setSelectedField(null);
    }
  };

  const moveField = (sectionIndex, fieldIndex, direction) => {
    const section = formData.sections[sectionIndex];
    if (
      (direction === 'up' && fieldIndex === 0) ||
      (direction === 'down' && fieldIndex === section.fields.length - 1)
    ) {
      return;
    }

    setFormData(prev => {
      const newSections = [...prev.sections];
      const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
      [newSections[sectionIndex].fields[fieldIndex], newSections[sectionIndex].fields[targetIndex]] =
        [newSections[sectionIndex].fields[targetIndex], newSections[sectionIndex].fields[fieldIndex]];
      return { ...prev, sections: newSections };
    });

    // Update selected field index
    if (
      selectedField?.sectionIndex === sectionIndex &&
      selectedField?.fieldIndex === fieldIndex
    ) {
      setSelectedField({ sectionIndex, fieldIndex: direction === 'up' ? fieldIndex - 1 : fieldIndex + 1 });
    }
  };

  const updateField = (sectionIndex, fieldIndex, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      if (field.includes('.')) {
        const parts = field.split('.');
        let obj = newSections[sectionIndex].fields[fieldIndex];
        for (let i = 0; i < parts.length - 1; i++) {
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
      } else {
        newSections[sectionIndex].fields[fieldIndex][field] = value;
      }
      return { ...prev, sections: newSections };
    });
  };

  // Table column management functions for StructureTab
  const addTableColumn = (sectionIndex) => {
    const section = formData.sections[sectionIndex];
    if (!section.advancedLayout) {
      section.advancedLayout = {
        layoutType: 'table',
        table: { enabled: true, columns: [] }
      };
    }
    if (!section.advancedLayout.table) {
      section.advancedLayout.table = { enabled: true, columns: [] };
    }
    if (section.advancedLayout.layoutType !== 'table') {
      section.advancedLayout.layoutType = 'table';
    }
    if (!section.advancedLayout.table.enabled) {
      section.advancedLayout.table.enabled = true;
    }

    const newColumn = {
      id: `col_${Date.now()}`,
      label: { en: '', ar: '' },
      fieldKey: '',
      fieldType: 'text', // Default to text
      width: 'auto',
      alignment: 'left',
      headerStyle: {
        backgroundColor: '#d4b900',
        textColor: '#ffffff',
        fontSize: 18,
        bold: true
      }
    };

    setFormData(prev => {
      const newSections = [...prev.sections];
      if (!newSections[sectionIndex].advancedLayout) {
        newSections[sectionIndex].advancedLayout = {
          layoutType: 'table',
          table: { enabled: true, columns: [] }
        };
      }
      if (!newSections[sectionIndex].advancedLayout.table) {
        newSections[sectionIndex].advancedLayout.table = { enabled: true, columns: [] };
      }
      if (newSections[sectionIndex].advancedLayout.layoutType !== 'table') {
        newSections[sectionIndex].advancedLayout.layoutType = 'table';
      }
      if (!newSections[sectionIndex].advancedLayout.table.enabled) {
        newSections[sectionIndex].advancedLayout.table.enabled = true;
      }
      newSections[sectionIndex].advancedLayout.table.columns.push(newColumn);
      return { ...prev, sections: newSections };
    });
  };

  const removeTableColumn = (sectionIndex, columnIndex) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      if (newSections[sectionIndex].advancedLayout?.table?.columns) {
        newSections[sectionIndex].advancedLayout.table.columns.splice(columnIndex, 1);
      }
      return { ...prev, sections: newSections };
    });
  };

  const updateTableColumn = (sectionIndex, columnIndex, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      if (!newSections[sectionIndex].advancedLayout?.table?.columns) {
        return prev;
      }
      if (field.includes('.')) {
        const parts = field.split('.');
        let obj = newSections[sectionIndex].advancedLayout.table.columns[columnIndex];
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
      } else {
        newSections[sectionIndex].advancedLayout.table.columns[columnIndex][field] = value;
      }
      return { ...prev, sections: newSections };
    });
  };

  const moveTableColumn = (sectionIndex, columnIndex, direction) => {
    const section = formData.sections[sectionIndex];
    const columns = section.advancedLayout?.table?.columns || [];
    if (
      (direction === 'up' && columnIndex === 0) ||
      (direction === 'down' && columnIndex === columns.length - 1)
    ) {
      return;
    }

    setFormData(prev => {
      const newSections = [...prev.sections];
      const targetIndex = direction === 'up' ? columnIndex - 1 : columnIndex + 1;
      const cols = newSections[sectionIndex].advancedLayout.table.columns;
      [cols[columnIndex], cols[targetIndex]] = [cols[targetIndex], cols[columnIndex]];
      return { ...prev, sections: newSections };
    });
  };

  const updateLayout = (field, value) => {
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [field]: value
      }
    }));
  };

  const updatePdfStyle = (path, value) => {
    setFormData(prev => {
      const newPdfStyle = { ...prev.pdfStyle };
      const parts = path.split('.');
      let obj = newPdfStyle;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return {
        ...prev,
        pdfStyle: newPdfStyle
      };
    });
  };

  const loadReadyMadeTemplate = (templateKey) => {
    console.log('Loading template with key:', templateKey);
    console.log('Available templates:', Object.keys(readyMadeTemplates));
    const template = readyMadeTemplates[templateKey];
    if (!template) {
      console.error('Template not found for key:', templateKey);
      showError(t('templates.templateNotFound'));
      return;
    }

    try {
      // Deep clone the template to avoid reference issues
      const templateData = JSON.parse(JSON.stringify(template.template));

      // Generate unique IDs for sections and fields
      const timestamp = Date.now();
      templateData.sections = templateData.sections.map((section, sIdx) => {
        const sectionId = `section_${timestamp}_${sIdx}`;
        return {
          ...section,
          id: sectionId,
          order: section.order !== undefined ? section.order : sIdx,
          visible: section.visible !== false,
          fields: (section.fields || []).map((field, fIdx) => ({
            ...field,
            key: field.key || `field_${timestamp}_${sIdx}_${fIdx}`,
            order: field.order !== undefined ? field.order : fIdx,
            visible: field.visible !== false,
            required: field.required || false,
            placeholder: field.placeholder || { en: '', ar: '' },
            options: field.options || [],
            width: field.width || 'full',
            pdfDisplay: field.pdfDisplay || {
              showLabel: true,
              showValue: true,
              fontSize: 10,
              bold: false
            }
          }))
        };
      });

      // Ensure layout object exists with proper structure
      if (!templateData.layout) {
        templateData.layout = {
          sectionOrder: [],
          pageSize: 'A4',
          orientation: 'portrait',
          margins: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
          }
        };
      }

      // Set section order
      templateData.layout.sectionOrder = templateData.sections.map(s => s.id);
      templateData.layout.pageSize = templateData.layout.pageSize || 'A4';
      templateData.layout.orientation = templateData.layout.orientation || 'portrait';
      templateData.layout.margins = templateData.layout.margins || {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      };

      // Ensure pdfStyle exists and has all required properties
      if (!templateData.pdfStyle) {
        templateData.pdfStyle = JSON.parse(JSON.stringify(formData.pdfStyle));
      }

      // Ensure branding exists in pdfStyle
      if (!templateData.pdfStyle.branding) {
        templateData.pdfStyle.branding = {
          primaryColor: '#d4b900',
          secondaryColor: '#b51c20',
          logoUrl: '',
          companyName: 'Atsha'
        };
      }

      // Ensure default values
      templateData.visibleToRoles = templateData.visibleToRoles || ['admin', 'supervisor', 'employee'];
      templateData.editableByRoles = templateData.editableByRoles || ['admin', 'supervisor', 'employee'];
      templateData.departments = templateData.departments || ['all'];
      templateData.requiresApproval = templateData.requiresApproval !== undefined ? templateData.requiresApproval : true;

      // Ensure description exists
      if (!templateData.description) {
        templateData.description = { en: '', ar: '' };
      }

      // Ensure all sections have complete advancedLayout structure
      templateData.sections = templateData.sections.map((section) => {
        const updatedSection = { ...section };

        // Ensure advancedLayout exists with all required properties
        if (!updatedSection.advancedLayout) {
          updatedSection.advancedLayout = {
            layoutType: 'simple',
            table: { enabled: false },
            columns: { enabled: false },
            grid: { enabled: false }
          };
        }

        // Ensure table structure is complete if layoutType is table
        if (updatedSection.advancedLayout.layoutType === 'table' && updatedSection.advancedLayout.table) {
          if (!updatedSection.advancedLayout.table.headerStyle) {
            updatedSection.advancedLayout.table.headerStyle = {
              backgroundColor: '#d4b900',
              textColor: '#ffffff',
              fontSize: 12,
              bold: true
            };
          }
          if (!updatedSection.advancedLayout.table.cellStyle) {
            updatedSection.advancedLayout.table.cellStyle = {
              backgroundColor: '#ffffff',
              textColor: '#000000',
              fontSize: 16
            };
          }
          if (updatedSection.advancedLayout.table.enabled === undefined) {
            updatedSection.advancedLayout.table.enabled = true;
          }
        }

        // Ensure columns structure is complete if layoutType is columns
        if (updatedSection.advancedLayout.layoutType === 'columns' && updatedSection.advancedLayout.columns) {
          if (updatedSection.advancedLayout.columns.enabled === undefined) {
            updatedSection.advancedLayout.columns.enabled = true;
          }
        }

        // Ensure all fields have complete structure
        updatedSection.fields = (updatedSection.fields || []).map((field) => ({
          ...field,
          key: field.key || `field_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          order: field.order !== undefined ? field.order : updatedSection.fields.indexOf(field),
          visible: field.visible !== false,
          required: field.required || false,
          placeholder: field.placeholder || { en: '', ar: '' },
          options: field.options || [],
          width: field.width || 'full',
          pdfDisplay: field.pdfDisplay || {
            showLabel: true,
            showValue: true,
            fontSize: 16,
            bold: false
          },
          layout: field.layout || {}
        }));

        // Ensure section has pdfStyle
        if (!updatedSection.pdfStyle) {
          updatedSection.pdfStyle = {
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            marginTop: 10,
            marginBottom: 10,
            showBorder: true,
            showBackground: false
          };
        }

        return updatedSection;
      });

      console.log('Loading template:', templateKey, templateData);

      // Merge with existing formData to preserve any user changes, but replace sections
      setFormData(prev => ({
        ...prev,
        ...templateData,
        // Keep the template's sections but ensure they're fully populated
        sections: templateData.sections
      }));

      setShowTemplateLibrary(false);

      // Select the first section to make it visible/expanded
      setTimeout(() => {
        if (templateData.sections.length > 0) {
          setSelectedSection(0);
        }
        showSuccess(t('templates.templateLoaded') || `Template "${template.name[isRTL ? 'ar' : 'en']}" loaded successfully`);
      }, 100);
    } catch (error) {
      console.error('Error loading template:', error);
      showError('Error loading template. Please try again.');
    }
  };

  const ensureFieldKeys = () => {
    // Auto-generate keys for fields that don't have them and return updated sections
    let needsUpdate = false;
    const updatedSections = formData.sections.map((section, sIdx) => {
      const updatedFields = section.fields.map((field, fIdx) => {
        if (!field.key || !field.key.trim()) {
          needsUpdate = true;
          return {
            ...field,
            key: `field_${section.id}_${fIdx}_${Date.now()}`
          };
        }
        return field;
      });
      return { ...section, fields: updatedFields };
    });

    if (needsUpdate) {
      setFormData(prev => ({ ...prev, sections: updatedSections }));
      return updatedSections;
    }
    return formData.sections;
  };

  const validate = () => {
    // Ensure all fields have keys before validation
    const sectionsToValidate = ensureFieldKeys();

    // Use updated sections for validation
    const dataToValidate = { ...formData, sections: sectionsToValidate };

    const newErrors = {};

    if (!dataToValidate.title.en.trim()) {
      newErrors.titleEn = t('common.required');
    }
    if (!dataToValidate.title.ar.trim()) {
      newErrors.titleAr = t('common.required');
    }

    if (dataToValidate.sections.length === 0) {
      newErrors.sections = t('templates.atLeastOneSection');
    }

    dataToValidate.sections.forEach((section, sIdx) => {
      if (!section.label || !section.label.en || !section.label.en.trim()) {
        newErrors[`section_${sIdx}_labelEn`] = t('common.required');
      }
      if (!section.label || !section.label.ar || !section.label.ar.trim()) {
        newErrors[`section_${sIdx}_labelAr`] = t('common.required');
      }

      // Header and Footer sections don't require fields
      // Also, sections with table layouts that have columns defined don't need fields in the fields array
      const sectionTypesWithoutFields = ['header', 'footer'];
      const hasTableLayoutWithColumns = section.advancedLayout?.layoutType === 'table' &&
        section.advancedLayout?.table?.enabled &&
        section.advancedLayout?.table?.columns &&
        section.advancedLayout?.table?.columns.length > 0;

      if (section.fields.length === 0 &&
        !sectionTypesWithoutFields.includes(section.sectionType) &&
        !hasTableLayoutWithColumns) {
        newErrors[`section_${sIdx}_fields`] = t('templates.atLeastOneField');
      }

      section.fields.forEach((field, fIdx) => {
        // Field key should exist (auto-generated if missing)
        const fieldKey = field.key || `field_${section.id}_${fIdx}_${Date.now()}`;
        if (!fieldKey.trim()) {
          newErrors[`section_${sIdx}_field_${fIdx}_key`] = t('common.required');
        }

        if (!field.label || !field.label.en || !field.label.en.trim()) {
          newErrors[`section_${sIdx}_field_${fIdx}_labelEn`] = t('common.required');
        }
        if (!field.label || !field.label.ar || !field.label.ar.trim()) {
          newErrors[`section_${sIdx}_field_${fIdx}_labelAr`] = t('common.required');
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showWarning(t('templates.fixErrors'));
      return;
    }

    // Ensure all sections have advancedLayout initialized before saving
    // Set departments based on templateDepartment
    const departmentsToSave = formData.templateDepartment === 'all'
      ? ['all']
      : [formData.templateDepartment];

    const formDataToSave = {
      ...formData,
      departments: departmentsToSave,
      sections: formData.sections.map(section => {
        // Deep clone section to preserve all nested properties including styling
        const updatedSection = JSON.parse(JSON.stringify(section));

        // Ensure advancedLayout exists
        if (!updatedSection.advancedLayout) {
          updatedSection.advancedLayout = {
            layoutType: 'simple',
            table: {
              enabled: false,
              columns: [],
              dynamicRows: false,
              rowSource: '',
              showHeader: true,
              showBorders: true,
              stripedRows: false,
              headerStyle: {
                backgroundColor: '#f3f4f6',
                textColor: '#000000',
                fontSize: 14
              },
              cellStyle: {
                backgroundColor: '#ffffff',
                textColor: '#000000',
                fontSize: 16
              }
            },
            columns: {
              enabled: false,
              columnCount: 2,
              columnGap: 20,
              columnWidths: [],
              equalWidths: true
            },
            grid: {
              enabled: false,
              rows: 1,
              columns: 1,
              gap: 10,
              template: ''
            },
            spacing: {
              sectionSpacing: 20,
              fieldSpacing: 10,
              lineSpacing: 1.2
            },
            sizing: {
              width: '100%',
              maxWidth: '100%',
              minWidth: 'auto',
              height: 'auto',
              maxHeight: 'auto',
              minHeight: 'auto'
            },
            padding: {
              top: 10,
              right: 10,
              bottom: 10,
              left: 10
            },
            margins: {
              top: 10,
              right: 10,
              bottom: 10,
              left: 10
            },
            styling: {
              titleColor: '#000000',
              titleFontSize: 20,
              showTitle: true,
              backgroundColor: '#ffffff',
              textColor: '#000000',
              borderColor: '#e5e7eb'
            }
          };
        } else {
          // Ensure styling object exists
          if (!updatedSection.advancedLayout.styling) {
            updatedSection.advancedLayout.styling = {
              titleColor: '#000000',
              titleFontSize: 20,
              showTitle: true,
              backgroundColor: '#ffffff',
              textColor: '#000000',
              borderColor: '#e5e7eb'
            };
          } else {
            // Preserve all existing styling properties - don't override showTitle if it exists
            // Only set defaults for missing properties
            updatedSection.advancedLayout.styling = {
              titleColor: updatedSection.advancedLayout.styling.titleColor || '#000000',
              titleFontSize: updatedSection.advancedLayout.styling.titleFontSize || 20,
              showTitle: updatedSection.advancedLayout.styling.showTitle !== undefined
                ? updatedSection.advancedLayout.styling.showTitle
                : true, // Only default to true if completely missing
              backgroundColor: updatedSection.advancedLayout.styling.backgroundColor || '#ffffff',
              textColor: updatedSection.advancedLayout.styling.textColor || '#000000',
              borderColor: updatedSection.advancedLayout.styling.borderColor || '#e5e7eb'
            };
          }

          // Ensure table headerStyle and cellStyle exist
          if (updatedSection.advancedLayout.table) {
            if (!updatedSection.advancedLayout.table.headerStyle) {
              updatedSection.advancedLayout.table.headerStyle = {
                backgroundColor: '#f3f4f6',
                textColor: '#000000',
                fontSize: 18
              };
            }
            if (!updatedSection.advancedLayout.table.cellStyle) {
              updatedSection.advancedLayout.table.cellStyle = {
                backgroundColor: '#ffffff',
                textColor: '#000000',
                fontSize: 16
              };
            }
            // Ensure each column has fieldType when saving
            if (updatedSection.advancedLayout.table.columns) {
              updatedSection.advancedLayout.table.columns = updatedSection.advancedLayout.table.columns.map(col => ({
                ...col,
                fieldType: col.fieldType || 'text' // Default to 'text' if missing
              }));
            }
          }
        }

        // The deep clone should already have styling from formData
        // Just ensure it exists if somehow missing
        if (updatedSection.advancedLayout && !updatedSection.advancedLayout.styling) {
          updatedSection.advancedLayout.styling = {
            titleColor: '#000000',
            titleFontSize: 20,
            showTitle: true,
            backgroundColor: '#ffffff',
            textColor: '#000000',
            borderColor: '#e5e7eb'
          };
        }

        // Debug: Log styling and columns before save
        if (process.env.NODE_ENV === 'development') {
          console.log(`[TemplateBuilder] Section ${updatedSection.id} styling before save:`, updatedSection.advancedLayout?.styling);
          if (updatedSection.advancedLayout?.table?.columns) {
            console.log(`[TemplateBuilder] Section ${updatedSection.id} table columns before save:`, updatedSection.advancedLayout.table.columns.map(col => ({
              id: col.id,
              label: col.label,
              fieldType: col.fieldType
            })));
          }
        }

        return updatedSection;
      })
    };

    // Debug: Log formDataToSave to verify styling is included
    if (process.env.NODE_ENV === 'development') {
      console.log('FormDataToSave sections:', formDataToSave.sections.map(s => ({
        id: s.id,
        hasAdvancedLayout: !!s.advancedLayout,
        hasStyling: !!s.advancedLayout?.styling,
        styling: s.advancedLayout?.styling
      })));
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await api.put(`/form-templates/${id}`, formDataToSave);
        showSuccess(t('templates.updatedSuccessfully'));
      } else {
        await api.post('/form-templates', formDataToSave);
        showSuccess(t('templates.createdSuccessfully'));
      }
      navigate('/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      showError(error.response?.data?.message || t('templates.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-darko rounded-2xl shadow-lg p-6">
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <FaArrowLeft />
            <span>{t('common.back')}</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FaFileAlt className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isEditMode ? t('templates.editTemplate') : t('forms.createTemplate')}
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  {t('templates.designCustomFormTemplate')}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              icon={FaSave}
            >
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'structure', label: t('templates.structure'), icon: FaFileAlt },
              { id: 'layout', label: t('templates.layout'), icon: FaCog },
              { id: 'advanced', label: t('templates.advancedLayout'), icon: FaTable },
              { id: 'styling', label: t('templates.styling'), icon: FaPalette },
              { id: 'preview', label: t('templates.preview'), icon: FaEye }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Smart Recommendations */}
            {showRecommendations && recommendations.length > 0 && (
              <Card className="mb-6 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FaMagic className="text-primary text-xl" />
                    <h3 className="text-lg font-bold text-gray-800">
                      {t('templates.smartRecommendations') || 'Smart Recommendations'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowRecommendations(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {t('templates.recommendationsDescription') || 'Based on your template, we recommend these improvements:'}
                </p>
                <div className="space-y-3">
                  {recommendations.slice(0, 5).map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${rec.type === 'layout' ? 'bg-blue-100 text-blue-800' :
                            rec.type === 'styling' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                            {rec.type === 'layout' ? (t('templates.layout') || 'Layout') :
                              rec.type === 'styling' ? (t('templates.styling') || 'Styling') :
                                (t('templates.structure') || 'Structure')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${rec.priority === 'high' ? 'bg-primary text-primary-darko' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {rec.priority === 'high' ? (t('templates.highPriority') || 'High') :
                              rec.priority === 'medium' ? (t('templates.mediumPriority') || 'Medium') :
                                (t('templates.lowPriority') || 'Low')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {rec.title[isRTL ? 'ar' : 'en']}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {rec.description[isRTL ? 'ar' : 'en']}
                        </p>
                      </div>
                      {rec.action && (
                        <Button
                          onClick={() => {
                            const updatedFormData = rec.action();
                            setFormData(updatedFormData);
                            showSuccess(t('templates.recommendationApplied') || 'Recommendation applied successfully!');
                          }}
                          variant="primary"
                          size="sm"
                          className="ml-4"
                        >
                          {t('templates.apply') || 'Apply'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {recommendations.length > 5 && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    {t('templates.moreRecommendations') || `+${recommendations.length - 5} more recommendations available`}
                  </p>
                )}
              </Card>
            )}

            {/* Template Library - Show before Structure Tab */}
            {!isEditMode && formData.sections.length === 0 && (
              <div className="mb-6">
                {/* Template Library Button */}
                {!showTemplateLibrary && (
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{t('templates.useReadyTemplate') || 'Use Ready-Made Template'}</h3>
                        <p className="text-sm text-gray-600">{t('templates.selectFromLibrary') || 'Select a pre-configured template to get started quickly'}</p>
                      </div>
                      <Button
                        onClick={() => setShowTemplateLibrary(true)}
                        icon={FaMagic}
                        variant="primary"
                      >
                        {t('templates.browseTemplates') || 'Browse Templates'}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Template Library Modal */}
                {showTemplateLibrary && (
                  <Card className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">{t('templates.templateLibrary') || 'Template Library'}</h3>
                      <button
                        onClick={() => setShowTemplateLibrary(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(readyMadeTemplates).map(([templateKey, template]) => (
                        <div
                          key={template.id}
                          className="border border-gray-300 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                          onClick={() => loadReadyMadeTemplate(templateKey)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-800">
                              {template.name[isRTL ? 'ar' : 'en']}
                            </h4>
                            <FaDownload className="text-primary" />
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {template.description[isRTL ? 'ar' : 'en']}
                          </p>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadReadyMadeTemplate(templateKey);
                            }}
                            variant="primary"
                            size="sm"
                            className="w-full"
                          >
                            {t('templates.useThisTemplate') || 'Use This Template'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Structure Tab */}
            {activeTab === 'structure' && (
              <StructureTab
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                isRTL={isRTL}
                t={t}
                fieldTypes={fieldTypes}
                sectionTypes={sectionTypes}
                widthOptions={widthOptions}
                selectedSection={selectedSection}
                setSelectedSection={setSelectedSection}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                addSection={addSection}
                duplicateSection={duplicateSection}
                removeSection={removeSection}
                moveSection={moveSection}
                updateSection={updateSection}
                addField={addField}
                duplicateField={duplicateField}
                removeField={removeField}
                moveField={moveField}
                updateField={updateField}
                addTableColumn={addTableColumn}
                removeTableColumn={removeTableColumn}
                updateTableColumn={updateTableColumn}
                moveTableColumn={moveTableColumn}
              />
            )}

            {/* Layout Tab */}
            {activeTab === 'layout' && (
              <LayoutTab
                formData={formData}
                updateLayout={updateLayout}
                isRTL={isRTL}
                t={t}
              />
            )}

            {/* Advanced Layout Tab */}
            {activeTab === 'advanced' && (
              <AdvancedLayoutTab
                formData={formData}
                setFormData={setFormData}
                selectedSection={selectedSection}
                isRTL={isRTL}
                t={t}
              />
            )}

            {/* Styling Tab */}
            {activeTab === 'styling' && (
              <StylingTab
                formData={formData}
                updatePdfStyle={updatePdfStyle}
                isRTL={isRTL}
                t={t}
              />
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <PreviewTab
                formData={formData}
                isRTL={isRTL}
                t={t}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Structure Tab Component
const StructureTab = ({
  formData,
  setFormData,
  errors,
  isRTL,
  t,
  fieldTypes,
  sectionTypes,
  widthOptions,
  selectedSection,
  setSelectedSection,
  selectedField,
  setSelectedField,
  addSection,
  duplicateSection,
  removeSection,
  moveSection,
  updateSection,
  addField,
  duplicateField,
  removeField,
  moveField,
  updateField,
  addTableColumn,
  removeTableColumn,
  updateTableColumn,
  moveTableColumn
}) => {
  return (
    <div className="space-y-6">
      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <Card className="border-primary bg-primary">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <FaTimes className="text-primary text-lg" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary-darko mb-2">{t('templates.fixErrors')}</h3>
              <div className="space-y-1 text-sm text-primary">
                {errors.titleEn && <div>• {t('templates.titleEnglish')}: {errors.titleEn}</div>}
                {errors.titleAr && <div>• {t('templates.titleArabic')}: {errors.titleAr}</div>}
                {errors.sections && <div>• {errors.sections}</div>}
                {formData.sections.map((section, sIdx) => (
                  <React.Fragment key={section.id}>
                    {errors[`section_${sIdx}_labelEn`] && (
                      <div>• {section.label.en || `Section ${sIdx + 1}`} - {t('templates.labelEnglish')}: {errors[`section_${sIdx}_labelEn`]}</div>
                    )}
                    {errors[`section_${sIdx}_labelAr`] && (
                      <div>• {section.label.en || `Section ${sIdx + 1}`} - {t('templates.labelArabic')}: {errors[`section_${sIdx}_labelAr`]}</div>
                    )}
                    {errors[`section_${sIdx}_fields`] && (
                      <div>• {section.label.en || `Section ${sIdx + 1}`} - {errors[`section_${sIdx}_fields`]}</div>
                    )}
                    {section.fields.map((field, fIdx) => (
                      <React.Fragment key={field.key}>
                        {errors[`section_${sIdx}_field_${fIdx}_key`] && (
                          <div>• {section.label.en || `Section ${sIdx + 1}`} → {field.label.en || `Field ${fIdx + 1}`} - {t('templates.fieldKey')}: {errors[`section_${sIdx}_field_${fIdx}_key`]}</div>
                        )}
                        {errors[`section_${sIdx}_field_${fIdx}_labelEn`] && (
                          <div>• {section.label.en || `Section ${sIdx + 1}`} → {field.label.en || `Field ${fIdx + 1}`} - {t('templates.labelEnglish')}: {errors[`section_${sIdx}_field_${fIdx}_labelEn`]}</div>
                        )}
                        {errors[`section_${sIdx}_field_${fIdx}_labelAr`] && (
                          <div>• {section.label.en || `Section ${sIdx + 1}`} → {field.label.en || `Field ${fIdx + 1}`} - {t('templates.labelArabic')}: {errors[`section_${sIdx}_field_${fIdx}_labelAr`]}</div>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.basicInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.titleEnglish')} <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.title.en}
              onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, en: e.target.value } }))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.titleEn ? 'border-primary' : 'border-gray-300'}`}
              placeholder={t('templates.titleEnglishPlaceholder')}
            />
            {errors.titleEn && <p className="mt-1 text-sm text-primary">{errors.titleEn}</p>}
          </div>

          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.titleArabic')} <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.title.ar}
              onChange={(e) => setFormData(prev => ({ ...prev, title: { ...prev.title, ar: e.target.value } }))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.titleAr ? 'border-primary' : 'border-gray-300'}`}
              placeholder={t('templates.titleArabicPlaceholder')}
              dir="rtl"
            />
            {errors.titleAr && <p className="mt-1 text-sm text-primary">{errors.titleAr}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.description')}
            </label>
            <textarea
              value={formData.description?.en || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, en: e.target.value } }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
              placeholder={t('templates.descriptionEnglishPlaceholder')}
            />
          </div>

          <div className="md:col-span-2">
            <textarea
              value={formData.description?.ar || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: { ...prev.description, ar: e.target.value } }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
              placeholder={t('templates.descriptionArabicPlaceholder')}
              dir="rtl"
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.department')} <span className="text-primary">*</span>
            </label>
            <Select
              value={formData.templateDepartment || 'all'}
              onChange={(e) => setFormData(prev => ({ ...prev, templateDepartment: e.target.value }))}
              options={[
                { value: 'all', label: t('common.allDepartments') },
                { value: 'kitchen', label: t('departments.kitchen') },
                { value: 'counter', label: t('departments.counter') },
                { value: 'cleaning', label: t('departments.cleaning') },
                { value: 'management', label: t('departments.management') },
                { value: 'delivery', label: t('departments.delivery') },
                { value: 'other', label: t('departments.other') }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">{t('templates.sections')}</h3>
          <Button onClick={addSection} icon={FaPlus} variant="primary">
            {t('templates.addSection')}
          </Button>
        </div>

        {formData.sections.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('templates.noSections')}</p>
              <Button onClick={addSection} icon={FaPlus} className="mt-4">
                {t('templates.addFirstSection')}
              </Button>
            </div>
          </Card>
        ) : (
          formData.sections.map((section, sIdx) => (
            <SectionCard
              key={section.id}
              section={section}
              sectionIndex={sIdx}
              isSelected={selectedSection === sIdx}
              onSelect={() => setSelectedSection(sIdx)}
              errors={errors}
              isRTL={isRTL}
              t={t}
              fieldTypes={fieldTypes}
              sectionTypes={sectionTypes}
              widthOptions={widthOptions}
              selectedField={selectedField}
              setSelectedField={setSelectedField}
              onDuplicate={() => duplicateSection(sIdx)}
              onRemove={() => removeSection(sIdx)}
              onMoveUp={() => moveSection(sIdx, 'up')}
              onMoveDown={() => moveSection(sIdx, 'down')}
              onUpdate={(field, value) => updateSection(sIdx, field, value)}
              onAddField={() => addField(sIdx)}
              onDuplicateField={(fIdx) => duplicateField(sIdx, fIdx)}
              onRemoveField={(fIdx) => removeField(sIdx, fIdx)}
              onMoveField={(fIdx, dir) => moveField(sIdx, fIdx, dir)}
              onUpdateField={(fIdx, field, value) => updateField(sIdx, fIdx, field, value)}
              onAddTableColumn={() => addTableColumn(sIdx)}
              onRemoveTableColumn={(colIdx) => removeTableColumn(sIdx, colIdx)}
              onUpdateTableColumn={(colIdx, field, value) => updateTableColumn(sIdx, colIdx, field, value)}
              onMoveTableColumn={(colIdx, dir) => moveTableColumn(sIdx, colIdx, dir)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Section Card Component
const SectionCard = ({
  section,
  sectionIndex,
  isSelected,
  onSelect,
  errors,
  isRTL,
  t,
  fieldTypes,
  sectionTypes,
  widthOptions,
  selectedField,
  setSelectedField,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onAddField,
  onDuplicateField,
  onRemoveField,
  onMoveField,
  onUpdateField,
  onAddTableColumn,
  onRemoveTableColumn,
  onUpdateTableColumn,
  onMoveTableColumn
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasErrors = errors[`section_${sectionIndex}_labelEn`] ||
    errors[`section_${sectionIndex}_labelAr`] ||
    errors[`section_${sectionIndex}_fields`] ||
    section.fields.some((_, fIdx) =>
      errors[`section_${sectionIndex}_field_${fIdx}_key`] ||
      errors[`section_${sectionIndex}_field_${fIdx}_labelEn`] ||
      errors[`section_${sectionIndex}_field_${fIdx}_labelAr`]
    );

  return (
    <Card className={`border-2 ${hasErrors ? 'border-primary bg-primary/30' : isSelected ? 'border-primary' : 'border-gray-200'}`}>
      {/* Section Error Messages */}
      {(errors[`section_${sectionIndex}_labelEn`] ||
        errors[`section_${sectionIndex}_labelAr`] ||
        errors[`section_${sectionIndex}_fields`]) && (
          <div className="mb-3 p-2 bg-primary border border-primary rounded text-xs text-primary">
            {errors[`section_${sectionIndex}_labelEn`] && (
              <div>• {t('templates.labelEnglish')}: {errors[`section_${sectionIndex}_labelEn`]}</div>
            )}
            {errors[`section_${sectionIndex}_labelAr`] && (
              <div>• {t('templates.labelArabic')}: {errors[`section_${sectionIndex}_labelAr`]}</div>
            )}
            {errors[`section_${sectionIndex}_fields`] && (
              <div>• {errors[`section_${sectionIndex}_fields`]}</div>
            )}
          </div>
        )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaGripVertical className="text-gray-400" />
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={section.label.en}
              onChange={(e) => onUpdate('label.en', e.target.value)}
              className={`text-lg font-semibold border-none focus:ring-2 focus:ring-primary rounded px-2 py-1 w-full ${errors[`section_${sectionIndex}_labelEn`] ? 'bg-primary border border-primary' : ''
                }`}
              placeholder={t('templates.sectionTitleEnPlaceholder')}
            />
            {errors[`section_${sectionIndex}_labelEn`] && (
              <p className="text-xs text-primary mt-1">{errors[`section_${sectionIndex}_labelEn`]}</p>
            )}
            <input
              type="text"
              value={section.label.ar}
              onChange={(e) => onUpdate('label.ar', e.target.value)}
              className={`text-sm text-gray-600 border-none focus:ring-2 focus:ring-primary rounded px-2 py-1 w-full mt-1 ${errors[`section_${sectionIndex}_labelAr`] ? 'bg-primary border border-primary' : ''
                }`}
              placeholder={t('templates.sectionTitleArPlaceholder')}
              dir="rtl"
            />
            {errors[`section_${sectionIndex}_labelAr`] && (
              <p className="text-xs text-primary mt-1">{errors[`section_${sectionIndex}_labelAr`]}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMoveUp}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('common.moveUp')}
          >
            <FaArrowUp className="text-gray-400" />
          </button>
          <button
            onClick={onMoveDown}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('common.moveDown')}
          >
            <FaArrowDown className="text-gray-400" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('common.duplicate')}
          >
            <FaCopy className="text-sm" />
          </button>
          <button
            onClick={() => onUpdate('visible', !section.visible)}
            className={`p-2 rounded-lg transition-colors ${section.visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
            title={section.visible ? t('common.hide') : t('common.show')}
          >
            {section.visible ? <FaEye /> : <FaEyeSlash />}
          </button>
          <button
            onClick={onRemove}
            className="p-2 text-primary hover:bg-primary rounded-lg transition-colors"
            title={t('common.delete')}
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* Section Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('templates.sectionType')}
          </label>
          <select
            value={section.sectionType || 'normal'}
            onChange={(e) => onUpdate('sectionType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {sectionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {isRTL ? type.labelAr || type.label : type.label || type.labelAr}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={section.visible !== false}
              onChange={(e) => onUpdate('visible', e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700">{t('templates.visible')}</span>
          </label>
        </div>
      </div>

      {/* Fields */}
      {isExpanded && (
        <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">{t('templates.fields')}</h4>
            <Button onClick={onAddField} size="sm" icon={FaPlus} variant="outline">
              {t('templates.addField')}
            </Button>
          </div>

          {/* Table Columns Management - if section uses table layout */}
          {section.advancedLayout?.layoutType === 'table' &&
            section.advancedLayout?.table?.enabled &&
            section.advancedLayout?.table?.columns ? (
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaTable className="text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-700">{t('templates.tableColumns') || 'Table Columns'}</h4>
                </div>
                <Button onClick={onAddTableColumn} size="sm" icon={FaPlus} variant="outline">
                  {t('templates.addColumn') || 'Add Column'}
                </Button>
              </div>

              {section.advancedLayout.table.columns.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">{t('templates.noTableColumns') || 'No table columns. Click "Add Column" to add one.'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {section.advancedLayout.table.columns.map((col, colIdx) => (
                    <div key={col.id || colIdx} className="border border-gray-200 rounded-lg p-3 bg-white hover:border-primary transition-colors">
                      <div className="flex items-start gap-3">
                        <button
                          className="p-1 hover:bg-gray-100 rounded transition-colors mt-1"
                        >
                          <FaGripVertical className="text-gray-400" />
                        </button>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('templates.columnLabel')} (EN)
                            </label>
                            <input
                              type="text"
                              value={col.label?.en || ''}
                              onChange={(e) => onUpdateTableColumn(colIdx, 'label.en', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder={t('templates.columnLabelEnPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('templates.columnLabel')} (AR)
                            </label>
                            <input
                              type="text"
                              value={col.label?.ar || ''}
                              onChange={(e) => onUpdateTableColumn(colIdx, 'label.ar', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder={t('templates.columnLabelArPlaceholder')}
                              dir="rtl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('templates.fieldType') || 'Field Type'}
                            </label>
                            <select
                              value={col.fieldType || 'text'}
                              onChange={(e) => onUpdateTableColumn(colIdx, 'fieldType', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              {fieldTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {isRTL ? type.labelAr || type.label : type.label || type.labelAr}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onMoveTableColumn(colIdx, 'up')}
                            disabled={colIdx === 0}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={t('common.moveUp')}
                          >
                            <FaArrowUp className="text-gray-400 text-xs" />
                          </button>
                          <button
                            onClick={() => onMoveTableColumn(colIdx, 'down')}
                            disabled={colIdx === section.advancedLayout.table.columns.length - 1}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={t('common.moveDown')}
                          >
                            <FaArrowDown className="text-gray-400 text-xs" />
                          </button>
                          <button
                            onClick={() => onRemoveTableColumn(colIdx)}
                            className="p-1.5 hover:bg-primary text-primary rounded transition-colors"
                            title={t('common.delete')}
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : section.fields.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('templates.noFields')}</p>
            </div>
          ) : (
            section.fields.map((field, fIdx) => (
              <FieldCard
                key={field.key}
                field={field}
                fieldIndex={fIdx}
                sectionIndex={sectionIndex}
                isSelected={selectedField?.sectionIndex === sectionIndex && selectedField?.fieldIndex === fIdx}
                onSelect={() => setSelectedField({ sectionIndex, fieldIndex: fIdx })}
                errors={errors}
                isRTL={isRTL}
                t={t}
                fieldTypes={fieldTypes}
                widthOptions={widthOptions}
                onDuplicate={() => onDuplicateField(fIdx)}
                onRemove={() => onRemoveField(fIdx)}
                onMoveUp={() => onMoveField(fIdx, 'up')}
                onMoveDown={() => onMoveField(fIdx, 'down')}
                onUpdate={(fieldName, value) => onUpdateField(fIdx, fieldName, value)}
              />
            ))
          )}
        </div>
      )}
    </Card>
  );
};

// Field Card Component
const FieldCard = ({
  field,
  fieldIndex,
  sectionIndex,
  isSelected,
  onSelect,
  errors,
  isRTL,
  t,
  fieldTypes,
  widthOptions,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-3 ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <FaGripVertical className="text-gray-400 text-xs" />
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={field.label.en}
              onChange={(e) => onUpdate('label.en', e.target.value)}
              className={`text-sm font-medium border-none focus:ring-2 focus:ring-primary rounded px-2 py-1 w-full ${errors[`section_${sectionIndex}_field_${fieldIndex}_labelEn`] ? 'bg-primary border border-primary' : ''
                }`}
              placeholder={t('templates.fieldLabelEnPlaceholder')}
            />
            {errors[`section_${sectionIndex}_field_${fieldIndex}_labelEn`] && (
              <p className="text-xs text-primary mt-1">{errors[`section_${sectionIndex}_field_${fieldIndex}_labelEn`]}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={t('common.moveUp')}
          >
            <FaArrowUp className="text-gray-400 text-xs" />
          </button>
          <button
            onClick={onMoveDown}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={t('common.moveDown')}
          >
            <FaArrowDown className="text-gray-400 text-xs" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title={t('common.duplicate')}
          >
            <FaCopy className="text-xs" />
          </button>
          <button
            onClick={() => onUpdate('visible', !field.visible)}
            className={`p-1 rounded transition-colors ${field.visible !== false ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
            title={field.visible !== false ? t('common.hide') : t('common.show')}
          >
            {field.visible !== false ? <FaEye className="text-xs" /> : <FaEyeSlash className="text-xs" />}
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-primary hover:bg-primary rounded transition-colors"
            title={t('common.delete')}
          >
            <FaTrash className="text-xs" />
          </button>
        </div>
      </div>

      {/* Error Messages - Always visible */}
      {(errors[`section_${sectionIndex}_field_${fieldIndex}_labelEn`] ||
        errors[`section_${sectionIndex}_field_${fieldIndex}_labelAr`] ||
        errors[`section_${sectionIndex}_field_${fieldIndex}_key`]) && (
          <div className="mt-2 p-2 bg-primary border border-primary rounded text-xs text-primary">
            {errors[`section_${sectionIndex}_field_${fieldIndex}_key`] && (
              <div>• {t('templates.fieldKey')}: {errors[`section_${sectionIndex}_field_${fieldIndex}_key`]}</div>
            )}
            {errors[`section_${sectionIndex}_field_${fieldIndex}_labelEn`] && (
              <div>• {t('templates.labelEnglish')}: {errors[`section_${sectionIndex}_field_${fieldIndex}_labelEn`]}</div>
            )}
            {errors[`section_${sectionIndex}_field_${fieldIndex}_labelAr`] && (
              <div>• {t('templates.labelArabic')}: {errors[`section_${sectionIndex}_field_${fieldIndex}_labelAr`]}</div>
            )}
          </div>
        )}

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.labelArabic')} {errors[`section_${sectionIndex}_field_${fieldIndex}_labelAr`] && <span className="text-primary">*</span>}
              </label>
              <input
                type="text"
                value={field.label.ar}
                onChange={(e) => onUpdate('label.ar', e.target.value)}
                className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${errors[`section_${sectionIndex}_field_${fieldIndex}_labelAr`] ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                placeholder={t('templates.fieldLabelArPlaceholder')}
                dir="rtl"
              />
              {errors[`section_${sectionIndex}_field_${fieldIndex}_labelAr`] && (
                <p className="mt-1 text-xs text-primary">{errors[`section_${sectionIndex}_field_${fieldIndex}_labelAr`]}</p>
              )}
            </div>
            <div>
              <label className={`block text-xs font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.fieldType')}
              </label>
              <select
                value={field.type}
                onChange={(e) => onUpdate('type', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {fieldTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {isRTL ? type.labelAr || type.label : type.label || type.labelAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.width')}
              </label>
              <select
                value={field.width || 'full'}
                onChange={(e) => onUpdate('width', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {widthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {isRTL ? opt.labelAr || opt.label : opt.label || opt.labelAr}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => onUpdate('required', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-xs text-gray-700">{t('common.required')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.visible !== false}
                  onChange={(e) => onUpdate('visible', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-xs text-gray-700">{t('templates.visible')}</span>
              </label>
            </div>
          </div>

          {field.type === 'select' && (
            <div>
              <label className={`block text-xs font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.options')}
              </label>
              <div className="space-y-2">
                {(field.options || []).map((opt, oIdx) => (
                  <div key={oIdx} className="flex gap-2">
                    <input
                      type="text"
                      value={opt.en || ''}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[oIdx] = { ...newOptions[oIdx], en: e.target.value };
                        onUpdate('options', newOptions);
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder={t('templates.optionEnPlaceholder')}
                    />
                    <input
                      type="text"
                      value={opt.ar || ''}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[oIdx] = { ...newOptions[oIdx], ar: e.target.value };
                        onUpdate('options', newOptions);
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder={t('templates.optionArPlaceholder')}
                      dir="rtl"
                    />
                    <button
                      onClick={() => {
                        const newOptions = field.options.filter((_, idx) => idx !== oIdx);
                        onUpdate('options', newOptions);
                      }}
                      className="p-1 text-primary hover:bg-primary rounded"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(field.options || []), { en: '', ar: '' }];
                    onUpdate('options', newOptions);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  + {t('templates.addOption')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Layout Tab Component
const LayoutTab = ({ formData, updateLayout, isRTL, t }) => {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.pageSettings')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.pageSize')}
            </label>
            <select
              value={formData.layout.pageSize}
              onChange={(e) => updateLayout('pageSize', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.orientation')}
            </label>
            <select
              value={formData.layout.orientation}
              onChange={(e) => updateLayout('orientation', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="portrait">{t('templates.portrait')}</option>
              <option value="landscape">{t('templates.landscape')}</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.margins')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['top', 'right', 'bottom', 'left'].map(margin => (
            <div key={margin}>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t(`templates.${margin}`)} (px)
              </label>
              <input
                type="number"
                value={formData.layout.margins[margin] ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                  updateLayout('margins', {
                    ...formData.layout.margins,
                    [margin]: val
                  });
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    updateLayout('margins', {
                      ...formData.layout.margins,
                      [margin]: 0
                    });
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.sectionOrder')}</h3>
        <div className="space-y-2">
          {formData.layout.sectionOrder.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('templates.noSectionsOrder')}</p>
          ) : (
            formData.layout.sectionOrder.map((sectionId, idx) => {
              const section = formData.sections.find(s => s.id === sectionId);
              return section ? (
                <div key={sectionId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-500 w-8">{idx + 1}.</span>
                  <span className="flex-1 text-sm text-gray-700">
                    {section.label.en || section.label.ar || sectionId}
                  </span>
                </div>
              ) : null;
            })
          )}
        </div>
      </Card>
    </div>
  );
};

// Styling Tab Component
const StylingTab = ({ formData, updatePdfStyle, isRTL, t }) => {
  return (
    <div className="space-y-6">
      {/* Header Styling */}
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.headerSettings')}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdfStyle.header.enabled}
                onChange={(e) => updatePdfStyle('header.enabled', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('templates.enableHeader')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdfStyle.header.showLogo !== false}
                onChange={(e) => updatePdfStyle('header.showLogo', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('templates.showLogo')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdfStyle.header.showCompanyName !== false}
                onChange={(e) => updatePdfStyle('header.showCompanyName', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('templates.showCompanyName') || 'Show Company Name'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdfStyle.header.showCompanyAddress !== false}
                onChange={(e) => updatePdfStyle('header.showCompanyAddress', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('templates.showCompanyAddress') || 'Show Company Address'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdfStyle.header.showTitle !== false}
                onChange={(e) => updatePdfStyle('header.showTitle', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('templates.showTitle')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdfStyle.header.showDate !== false}
                onChange={(e) => updatePdfStyle('header.showDate', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('templates.showDate')}</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.headerLayout') || 'Header Layout'}
              </label>
              <select
                value={formData.pdfStyle.header.layout || 'default'}
                onChange={(e) => updatePdfStyle('header.layout', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="default">{t('templates.defaultLayout') || 'Default (Logo + Company Left, Form Title Right)'}</option>
                <option value="split">{t('templates.splitLayout') || 'Split Layout (Logo + Company Left, Form Title Right)'}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.height')} (px)
              </label>
              <input
                type="number"
                value={formData.pdfStyle.header.height ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                  updatePdfStyle('header.height', val);
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    updatePdfStyle('header.height', 0);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.backgroundColor')}
              </label>
              <input
                type="color"
                value={formData.pdfStyle.header.backgroundColor}
                onChange={(e) => updatePdfStyle('header.backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.textColor')}
              </label>
              <input
                type="color"
                value={formData.pdfStyle.header.textColor}
                onChange={(e) => updatePdfStyle('header.textColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Border Settings */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-md font-semibold text-gray-700 mb-3">{t('templates.borderSettings') || 'Border Settings'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.header.border?.show !== false}
                  onChange={(e) => updatePdfStyle('header.border', {
                    ...formData.pdfStyle.header.border,
                    show: e.target.checked
                  })}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showBorder') || 'Show Border'}</span>
              </label>
            </div>
            {formData.pdfStyle.header.border?.show !== false && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pl-6 border-l-2 border-gray-200">
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('templates.borderWidth') || 'Border Width'} (px)
                  </label>
                  <input
                    type="number"
                    value={formData.pdfStyle.header.border?.width ?? 4}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                      updatePdfStyle('header.border', {
                        ...formData.pdfStyle.header.border,
                        width: val
                      });
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        updatePdfStyle('header.border', {
                          ...formData.pdfStyle.header.border,
                          width: 4
                        });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('templates.borderStyle') || 'Border Style'}
                  </label>
                  <select
                    value={formData.pdfStyle.header.border?.style || 'solid'}
                    onChange={(e) => updatePdfStyle('header.border', {
                      ...formData.pdfStyle.header.border,
                      style: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="solid">{t('templates.solid') || 'Solid'}</option>
                    <option value="dashed">{t('templates.dashed') || 'Dashed'}</option>
                    <option value="dotted">{t('templates.dotted') || 'Dotted'}</option>
                    <option value="double">{t('templates.double') || 'Double'}</option>
                    <option value="none">{t('templates.none') || 'None'}</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('templates.borderColor') || 'Border Color'}
                  </label>
                  <input
                    type="color"
                    value={formData.pdfStyle.header.border?.color || '#d4b900'}
                    onChange={(e) => updatePdfStyle('header.border', {
                      ...formData.pdfStyle.header.border,
                      color: e.target.value
                    })}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('templates.borderPosition') || 'Border Position'}
                  </label>
                  <select
                    value={formData.pdfStyle.header.border?.position || 'bottom'}
                    onChange={(e) => updatePdfStyle('header.border', {
                      ...formData.pdfStyle.header.border,
                      position: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="top">{t('templates.top') || 'Top'}</option>
                    <option value="bottom">{t('templates.bottom') || 'Bottom'}</option>
                    <option value="left">{t('templates.left') || 'Left'}</option>
                    <option value="right">{t('templates.right') || 'Right'}</option>
                    <option value="all">{t('templates.all') || 'All Sides'}</option>
                    <option value="none">{t('templates.none') || 'None'}</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Footer Styling */}
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.footerSettings')}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdfStyle.footer.enabled}
                onChange={(e) => updatePdfStyle('footer.enabled', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('templates.enableFooter')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdfStyle.footer.showPageNumbers}
                onChange={(e) => updatePdfStyle('footer.showPageNumbers', e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('templates.showPageNumbers')}</span>
            </label>
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.footerContent')} (EN)
            </label>
            <textarea
              value={formData.pdfStyle.footer.content?.en || ''}
              onChange={(e) => updatePdfStyle('footer.content', {
                ...formData.pdfStyle.footer.content,
                en: e.target.value
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
              placeholder="Footer content (English)"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.footerContent')} (AR)
            </label>
            <textarea
              value={formData.pdfStyle.footer.content?.ar || ''}
              onChange={(e) => updatePdfStyle('footer.content', {
                ...formData.pdfStyle.footer.content,
                ar: e.target.value
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
              placeholder="محتوى التذييل (عربي)"
              dir="rtl"
            />
          </div>
        </div>
      </Card>

      {/* Form Metadata Settings */}
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.formMetadataSettings') || 'Form Metadata Settings'}</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.pdfStyle.metadata?.enabled !== false}
              onChange={(e) => updatePdfStyle('metadata.enabled', e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700">{t('templates.enableFormMetadata') || 'Enable Form Metadata'}</span>
          </label>
          {formData.pdfStyle.metadata?.enabled !== false && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.metadata?.showFormId !== false}
                  onChange={(e) => updatePdfStyle('metadata.showFormId', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showFormId') || 'Show Form ID'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.metadata?.showDate !== false}
                  onChange={(e) => updatePdfStyle('metadata.showDate', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showDate') || 'Show Date'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.metadata?.showShift !== false}
                  onChange={(e) => updatePdfStyle('metadata.showShift', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showShift') || 'Show Shift'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.metadata?.showDepartment !== false}
                  onChange={(e) => updatePdfStyle('metadata.showDepartment', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showDepartment') || 'Show Department'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.metadata?.showFilledBy !== false}
                  onChange={(e) => updatePdfStyle('metadata.showFilledBy', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showFilledBy') || 'Show Filled By'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.metadata?.showSubmittedOn !== false}
                  onChange={(e) => updatePdfStyle('metadata.showSubmittedOn', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showSubmittedOn') || 'Show Submitted On'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.metadata?.showApprovedBy !== false}
                  onChange={(e) => updatePdfStyle('metadata.showApprovedBy', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showApprovedBy') || 'Show Approved By'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pdfStyle.metadata?.showApprovalDate !== false}
                  onChange={(e) => updatePdfStyle('metadata.showApprovalDate', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{t('templates.showApprovalDate') || 'Show Approval Date'}</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Branding */}
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.branding')}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.primaryColor')}
              </label>
              <input
                type="color"
                value={formData.pdfStyle.branding?.primaryColor || '#d4b900'}
                onChange={(e) => updatePdfStyle('branding.primaryColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('templates.secondaryColor')}
              </label>
              <input
                type="color"
                value={formData.pdfStyle.branding?.secondaryColor || '#b51c20'}
                onChange={(e) => updatePdfStyle('branding.secondaryColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.companyName')} (EN)
            </label>
            <input
              type="text"
              value={formData.pdfStyle.branding?.companyName?.en || ''}
              onChange={(e) => updatePdfStyle('branding.companyName', {
                ...(formData.pdfStyle.branding?.companyName || {}),
                en: e.target.value
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('templates.companyName')} (AR)
            </label>
            <input
              type="text"
              value={formData.pdfStyle.branding?.companyName?.ar || ''}
              onChange={(e) => updatePdfStyle('branding.companyName', {
                ...(formData.pdfStyle.branding?.companyName || {}),
                ar: e.target.value
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              dir="rtl"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Advanced Layout Tab Component
const AdvancedLayoutTab = ({ formData, setFormData, selectedSection, isRTL, t }) => {
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(selectedSection !== null ? selectedSection : (formData.sections.length > 0 ? 0 : null));

  const currentSection = selectedSectionIndex !== null ? formData.sections[selectedSectionIndex] : null;
  const advancedLayout = currentSection?.advancedLayout || {
    layoutType: 'simple',
    table: {
      enabled: false,
      columns: [],
      dynamicRows: false,
      showHeader: true,
      showBorders: true,
      stripedRows: false,
      headerStyle: {
        backgroundColor: '#f3f4f6',
        textColor: '#000000',
        fontSize: 18
      },
      cellStyle: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontSize: 16
      }
    },
    columns: { enabled: false, columnCount: 2, columnGap: 20, equalWidths: true },
    grid: { enabled: false, rows: 1, columns: 1, gap: 10 },
    spacing: { sectionSpacing: 20, fieldSpacing: 10, lineSpacing: 1.2 },
    sizing: { width: '100%', maxWidth: '100%', minWidth: 'auto', height: 'auto', maxHeight: 'auto', minHeight: 'auto' },
    padding: { top: 10, right: 10, bottom: 10, left: 10 },
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    styling: {
      titleColor: '#000000',
      titleFontSize: 20,
      showTitle: true,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#e5e7eb'
    }
  };

  const updateAdvancedLayout = (field, value) => {
    if (selectedSectionIndex === null) {
      showWarning(t('templates.selectSectionFirst'));
      return;
    }

    setFormData(prev => {
      const newSections = [...prev.sections];
      if (!newSections[selectedSectionIndex].advancedLayout) {
        newSections[selectedSectionIndex].advancedLayout = {
          layoutType: 'simple',
          table: {
            enabled: false,
            columns: [],
            dynamicRows: false,
            showHeader: true,
            showBorders: true,
            stripedRows: false,
            headerStyle: {
              backgroundColor: '#f3f4f6',
              textColor: '#000000',
              fontSize: 14
            },
            cellStyle: {
              backgroundColor: '#ffffff',
              textColor: '#000000',
              fontSize: 12
            }
          },
          columns: { enabled: false, columnCount: 2, columnGap: 20, equalWidths: true },
          grid: { enabled: false, rows: 1, columns: 1, gap: 10 },
          styling: {
            titleColor: '#000000',
            titleFontSize: 20,
            showTitle: true,
            backgroundColor: '#ffffff',
            textColor: '#000000',
            borderColor: '#e5e7eb'
          }
        };
      }

      // Ensure styling object exists (but don't override existing values)
      if (!newSections[selectedSectionIndex].advancedLayout.styling) {
        newSections[selectedSectionIndex].advancedLayout.styling = {
          titleColor: '#000000',
          titleFontSize: 20,
          showTitle: true,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          borderColor: '#e5e7eb'
        };
      }
      // Don't override showTitle if it's being updated - let the update happen below

      // Ensure table headerStyle and cellStyle exist
      if (newSections[selectedSectionIndex].advancedLayout.table) {
        if (!newSections[selectedSectionIndex].advancedLayout.table.headerStyle) {
          newSections[selectedSectionIndex].advancedLayout.table.headerStyle = {
            backgroundColor: '#f3f4f6',
            textColor: '#000000',
            fontSize: 18
          };
        }
        if (!newSections[selectedSectionIndex].advancedLayout.table.cellStyle) {
          newSections[selectedSectionIndex].advancedLayout.table.cellStyle = {
            backgroundColor: '#ffffff',
            textColor: '#000000',
            fontSize: 16
          };
        }
      }

      if (field.includes('.')) {
        const parts = field.split('.');
        let obj = newSections[selectedSectionIndex].advancedLayout;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        // Set the value - this will update showTitle correctly
        obj[parts[parts.length - 1]] = value;

        // Debug log for styling updates
        if (process.env.NODE_ENV === 'development' && field.includes('styling')) {
          console.log(`[TemplateBuilder] Updated ${field} to:`, value);
          console.log(`[TemplateBuilder] Current styling:`, newSections[selectedSectionIndex].advancedLayout.styling);
        }
      } else {
        newSections[selectedSectionIndex].advancedLayout[field] = value;
      }

      // Auto-enable table/columns/grid when layout type is set
      if (field === 'layoutType') {
        if (value === 'table') {
          if (!newSections[selectedSectionIndex].advancedLayout.table) {
            newSections[selectedSectionIndex].advancedLayout.table = {
              enabled: true,
              columns: [],
              dynamicRows: false,
              showHeader: true,
              showBorders: true,
              stripedRows: false
            };
          } else {
            newSections[selectedSectionIndex].advancedLayout.table.enabled = true;
          }
        } else if (value === 'columns') {
          if (!newSections[selectedSectionIndex].advancedLayout.columns) {
            newSections[selectedSectionIndex].advancedLayout.columns = {
              enabled: true,
              columnCount: 2,
              columnGap: 20,
              equalWidths: true
            };
          } else {
            newSections[selectedSectionIndex].advancedLayout.columns.enabled = true;
          }
        } else if (value === 'grid') {
          if (!newSections[selectedSectionIndex].advancedLayout.grid) {
            newSections[selectedSectionIndex].advancedLayout.grid = {
              enabled: true,
              rows: 1,
              columns: 1,
              gap: 10
            };
          } else {
            newSections[selectedSectionIndex].advancedLayout.grid.enabled = true;
          }
        }
      }

      return { ...prev, sections: newSections };
    });
  };

  const addTableColumn = () => {
    if (!currentSection) return;
    const newColumn = {
      id: `col_${Date.now()}`,
      label: { en: '', ar: '' },
      fieldKey: '',
      width: 'auto',
      alignment: 'left',
      headerStyle: { backgroundColor: '#f3f4f6', textColor: '#000000', fontSize: 18, bold: true }
    };

    setFormData(prev => {
      const newSections = [...prev.sections];
      if (!newSections[selectedSectionIndex].advancedLayout) {
        newSections[selectedSectionIndex].advancedLayout = advancedLayout;
      }
      if (!newSections[selectedSectionIndex].advancedLayout.table) {
        newSections[selectedSectionIndex].advancedLayout.table = { columns: [] };
      }
      newSections[selectedSectionIndex].advancedLayout.table.columns.push(newColumn);
      return { ...prev, sections: newSections };
    });
  };

  const removeTableColumn = (columnIndex) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      newSections[selectedSectionIndex].advancedLayout.table.columns.splice(columnIndex, 1);
      return { ...prev, sections: newSections };
    });
  };

  const updateTableColumn = (columnIndex, field, value) => {
    setFormData(prev => {
      const newSections = [...prev.sections];
      if (field.includes('.')) {
        const parts = field.split('.');
        let obj = newSections[selectedSectionIndex].advancedLayout.table.columns[columnIndex];
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
      } else {
        newSections[selectedSectionIndex].advancedLayout.table.columns[columnIndex][field] = value;
      }
      return { ...prev, sections: newSections };
    });
  };

  if (formData.sections.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <FaTable className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{t('templates.noSectionsForAdvancedLayout')}</p>
          <p className="text-sm text-gray-500">{t('templates.createSectionsFirst')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Selector */}
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.selectSection')}</h3>
        <select
          value={selectedSectionIndex !== null ? selectedSectionIndex : ''}
          onChange={(e) => setSelectedSectionIndex(e.target.value !== '' ? parseInt(e.target.value) : null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">{t('templates.selectSection')}</option>
          {formData.sections.map((section, idx) => (
            <option key={section.id} value={idx}>
              {isRTL ? section.label.ar || section.label.en : section.label.en || section.label.ar}
            </option>
          ))}
        </select>
      </Card>

      {currentSection && (
        <>
          {/* Layout Type Selector */}
          <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaTable />
              {t('templates.layoutType')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: 'simple', label: t('templates.simple'), icon: FaFileAlt },
                { value: 'table', label: t('templates.table'), icon: FaTable },
                { value: 'columns', label: t('templates.columns'), icon: FaColumns },
                { value: 'grid', label: t('templates.grid'), icon: FaBorderStyle }
              ].map(type => (
                <button
                  key={type.value}
                  onClick={() => updateAdvancedLayout('layoutType', type.value)}
                  className={`p-4 border-2 rounded-lg transition-all ${advancedLayout.layoutType === type.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <type.icon className="text-2xl mx-auto mb-2" />
                  <p className="text-sm font-medium">{type.label}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Table Layout Builder */}
          {advancedLayout.layoutType === 'table' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FaTable />
                  {t('templates.tableLayout')}
                </h3>
                <Button onClick={addTableColumn} icon={FaPlus} variant="primary" size="sm">
                  {t('templates.addColumn')}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedLayout.table?.enabled || false}
                      onChange={(e) => updateAdvancedLayout('table.enabled', e.target.checked)}
                      className="rounded"
                    />
                    <span>{t('templates.enableTable')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedLayout.table?.dynamicRows || false}
                      onChange={(e) => updateAdvancedLayout('table.dynamicRows', e.target.checked)}
                      className="rounded"
                    />
                    <span>{t('templates.dynamicRows')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedLayout.table?.showHeader !== false}
                      onChange={(e) => updateAdvancedLayout('table.showHeader', e.target.checked)}
                      className="rounded"
                    />
                    <span>{t('templates.showHeader')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedLayout.table?.showBorders !== false}
                      onChange={(e) => updateAdvancedLayout('table.showBorders', e.target.checked)}
                      className="rounded"
                    />
                    <span>{t('templates.showBorders')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedLayout.table?.stripedRows || false}
                      onChange={(e) => updateAdvancedLayout('table.stripedRows', e.target.checked)}
                      className="rounded"
                    />
                    <span>{t('templates.stripedRows')}</span>
                  </label>
                </div>

                {advancedLayout.table?.dynamicRows && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.rowSourceField')}
                    </label>
                    <select
                      value={advancedLayout.table?.rowSource || ''}
                      onChange={(e) => updateAdvancedLayout('table.rowSource', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('templates.selectField')}</option>
                      {currentSection.fields.map(field => (
                        <option key={field.key} value={field.key}>
                          {isRTL ? field.label.ar || field.label.en : field.label.en || field.label.ar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Table Columns */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">{t('templates.tableColumns')}</h4>
                  {advancedLayout.table?.columns?.map((column, colIdx) => (
                    <div key={column.id || colIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('templates.columnLabel')} (EN)
                          </label>
                          <input
                            type="text"
                            value={column.label?.en || ''}
                            onChange={(e) => updateTableColumn(colIdx, 'label.en', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder={t('templates.columnLabelEnPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('templates.columnLabel')} (AR)
                          </label>
                          <input
                            type="text"
                            value={column.label?.ar || ''}
                            onChange={(e) => updateTableColumn(colIdx, 'label.ar', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder={t('templates.columnLabelArPlaceholder')}
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('templates.fieldKey')}
                          </label>
                          <select
                            value={column.fieldKey || ''}
                            onChange={(e) => updateTableColumn(colIdx, 'fieldKey', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">{t('templates.selectField')}</option>
                            {currentSection.fields.map(field => (
                              <option key={field.key} value={field.key}>
                                {isRTL ? field.label.ar || field.label.en : field.label.en || field.label.ar}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('templates.width')}
                          </label>
                          <input
                            type="text"
                            value={column.width || 'auto'}
                            onChange={(e) => updateTableColumn(colIdx, 'width', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="auto, 100px, 25%"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('templates.alignment')}
                          </label>
                          <div className="flex gap-2">
                            {[
                              { value: 'left', icon: FaAlignLeft },
                              { value: 'center', icon: FaAlignCenter },
                              { value: 'right', icon: FaAlignRight }
                            ].map(align => (
                              <button
                                key={align.value}
                                onClick={() => updateTableColumn(colIdx, 'alignment', align.value)}
                                className={`p-2 border rounded-lg ${column.alignment === align.value
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-gray-300'
                                  }`}
                              >
                                <align.icon />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeTableColumn(colIdx)}
                        variant="danger"
                        size="sm"
                        icon={FaTrash}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Column Layout Builder */}
          {advancedLayout.layoutType === 'columns' && (
            <Card>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaColumns />
                {t('templates.columnLayout')}
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={advancedLayout.columns?.enabled || false}
                    onChange={(e) => updateAdvancedLayout('columns.enabled', e.target.checked)}
                    className="rounded"
                  />
                  <span>{t('templates.enableColumns')}</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.columnCount')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={advancedLayout.columns?.columnCount ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 1);
                        updateAdvancedLayout('columns.columnCount', val);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          updateAdvancedLayout('columns.columnCount', 2);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.columnGap')} (px)
                    </label>
                    <input
                      type="number"
                      value={advancedLayout.columns?.columnGap ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                        updateAdvancedLayout('columns.columnGap', val);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          updateAdvancedLayout('columns.columnGap', 20);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={advancedLayout.columns?.equalWidths !== false}
                        onChange={(e) => updateAdvancedLayout('columns.equalWidths', e.target.checked)}
                        className="rounded"
                      />
                      <span>{t('templates.equalWidths')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Grid Layout Builder */}
          {advancedLayout.layoutType === 'grid' && (
            <Card>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaBorderStyle />
                {t('templates.gridLayout')}
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={advancedLayout.grid?.enabled || false}
                    onChange={(e) => updateAdvancedLayout('grid.enabled', e.target.checked)}
                    className="rounded"
                  />
                  <span>{t('templates.enableGrid')}</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.rows')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={advancedLayout.grid?.rows ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 1);
                        updateAdvancedLayout('grid.rows', val);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          updateAdvancedLayout('grid.rows', 1);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.columns')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={advancedLayout.grid?.columns ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 1);
                        updateAdvancedLayout('grid.columns', val);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          updateAdvancedLayout('grid.columns', 1);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.gap')} (px)
                    </label>
                    <input
                      type="number"
                      value={advancedLayout.grid?.gap ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                        updateAdvancedLayout('grid.gap', val);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          updateAdvancedLayout('grid.gap', 10);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('templates.gridTemplate')} (CSS)
                  </label>
                  <input
                    type="text"
                    value={advancedLayout.grid?.template || ''}
                    onChange={(e) => updateAdvancedLayout('grid.template', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder="1fr 1fr 1fr"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('templates.gridTemplateHint')}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Spacing and Sizing Controls */}
          <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaBeer />
              {t('templates.spacingAndSizing')}
            </h3>
            <div className="space-y-6">
              {/* Spacing */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">{t('templates.spacing')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.sectionSpacing')} (px)
                    </label>
                    <input
                      type="number"
                      value={advancedLayout.spacing?.sectionSpacing ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                        updateAdvancedLayout('spacing.sectionSpacing', val);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          updateAdvancedLayout('spacing.sectionSpacing', 20);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.fieldSpacing')} (px)
                    </label>
                    <input
                      type="number"
                      value={advancedLayout.spacing?.fieldSpacing ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                        updateAdvancedLayout('spacing.fieldSpacing', val);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          updateAdvancedLayout('spacing.fieldSpacing', 10);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.lineSpacing')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={advancedLayout.spacing?.lineSpacing || 1.2}
                      onChange={(e) => updateAdvancedLayout('spacing.lineSpacing', parseFloat(e.target.value) || 1.2)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Sizing */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">{t('templates.sizing')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.width')}
                    </label>
                    <input
                      type="text"
                      value={advancedLayout.sizing?.width || '100%'}
                      onChange={(e) => updateAdvancedLayout('sizing.width', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="100%, 800px, auto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.maxWidth')}
                    </label>
                    <input
                      type="text"
                      value={advancedLayout.sizing?.maxWidth || '100%'}
                      onChange={(e) => updateAdvancedLayout('sizing.maxWidth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="100%, 1200px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.minWidth')}
                    </label>
                    <input
                      type="text"
                      value={advancedLayout.sizing?.minWidth || 'auto'}
                      onChange={(e) => updateAdvancedLayout('sizing.minWidth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="auto, 300px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.height')}
                    </label>
                    <input
                      type="text"
                      value={advancedLayout.sizing?.height || 'auto'}
                      onChange={(e) => updateAdvancedLayout('sizing.height', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="auto, 500px"
                    />
                  </div>
                </div>
              </div>

              {/* Padding */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">{t('templates.padding')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['top', 'right', 'bottom', 'left'].map(side => (
                    <div key={side}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t(`templates.${side}`)} (px)
                      </label>
                      <input
                        type="number"
                        value={advancedLayout.padding?.[side] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                          updateAdvancedLayout(`padding.${side}`, val);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updateAdvancedLayout(`padding.${side}`, 10);
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">{t('templates.margins')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['top', 'right', 'bottom', 'left'].map(side => (
                    <div key={side}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t(`templates.${side}`)} (px)
                      </label>
                      <input
                        type="number"
                        value={advancedLayout.margins?.[side] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                          updateAdvancedLayout(`margins.${side}`, val);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updateAdvancedLayout(`margins.${side}`, 10);
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Field Alignment Controls */}
          <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaAlignLeft />
              {t('templates.fieldAlignment')}
            </h3>
            <div className="space-y-4">
              {currentSection.fields.map((field, fIdx) => (
                <div key={field.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    {isRTL ? field.label.ar || field.label.en : field.label.en || field.label.ar}
                  </span>
                  <div className="flex gap-2">
                    {[
                      { value: 'left', icon: FaAlignLeft },
                      { value: 'center', icon: FaAlignCenter },
                      { value: 'right', icon: FaAlignRight }
                    ].map(align => (
                      <button
                        key={align.value}
                        onClick={() => {
                          setFormData(prev => {
                            const newSections = [...prev.sections];
                            if (!newSections[selectedSectionIndex].fields[fIdx].pdfDisplay) {
                              newSections[selectedSectionIndex].fields[fIdx].pdfDisplay = {};
                            }
                            newSections[selectedSectionIndex].fields[fIdx].pdfDisplay.alignment = align.value;
                            return { ...prev, sections: newSections };
                          });
                        }}
                        className={`p-2 border rounded-lg ${field.pdfDisplay?.alignment === align.value || (!field.pdfDisplay?.alignment && align.value === 'left')
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-300'
                          }`}
                      >
                        <align.icon />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Text Size Presets */}
          <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaFont />
              {t('templates.textSizePresets')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t('templates.xlarge'), sizes: { title: 28, sectionTitle: 22, fieldLabel: 16, fieldValue: 18, tableHeader: 16, tableCell: 14 } },
                { label: t('templates.large'), sizes: { title: 24, sectionTitle: 20, fieldLabel: 14, fieldValue: 16, tableHeader: 15, tableCell: 13 } },
                { label: t('templates.medium'), sizes: { title: 20, sectionTitle: 18, fieldLabel: 12, fieldValue: 14, tableHeader: 14, tableCell: 12 } },
                { label: t('templates.small'), sizes: { title: 16, sectionTitle: 14, fieldLabel: 10, fieldValue: 12, tableHeader: 12, tableCell: 10 } }
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setFormData(prev => {
                      const newSections = prev.sections.map(section => {
                        const updatedSection = { ...section };

                        // Ensure advancedLayout exists
                        if (!updatedSection.advancedLayout) {
                          updatedSection.advancedLayout = {
                            layoutType: 'simple',
                            styling: {},
                            table: { headerStyle: {}, cellStyle: {} }
                          };
                        }
                        if (!updatedSection.advancedLayout.styling) {
                          updatedSection.advancedLayout.styling = {};
                        }
                        if (!updatedSection.advancedLayout.table) {
                          updatedSection.advancedLayout.table = { headerStyle: {}, cellStyle: {} };
                        }
                        if (!updatedSection.advancedLayout.table.headerStyle) {
                          updatedSection.advancedLayout.table.headerStyle = {};
                        }
                        if (!updatedSection.advancedLayout.table.cellStyle) {
                          updatedSection.advancedLayout.table.cellStyle = {};
                        }

                        // Apply preset sizes to section title
                        updatedSection.advancedLayout.styling.titleFontSize = preset.sizes.sectionTitle;
                        updatedSection.advancedLayout.table.headerStyle.fontSize = preset.sizes.tableHeader;
                        updatedSection.advancedLayout.table.cellStyle.fontSize = preset.sizes.tableCell;

                        // Apply preset sizes to all fields in this section
                        updatedSection.fields = updatedSection.fields.map(field => {
                          const updatedField = { ...field };
                          if (!updatedField.layout) {
                            updatedField.layout = {};
                          }
                          if (!updatedField.pdfDisplay) {
                            updatedField.pdfDisplay = {};
                          }
                          updatedField.layout.labelFontSize = preset.sizes.fieldLabel;
                          updatedField.layout.valueFontSize = preset.sizes.fieldValue;
                          updatedField.pdfDisplay.fontSize = preset.sizes.fieldValue;
                          return updatedField;
                        });

                        return updatedSection;
                      });

                      // Update global PDF style font sizes
                      const newPdfStyle = { ...prev.pdfStyle };
                      if (!newPdfStyle.fontSize) {
                        newPdfStyle.fontSize = {};
                      }
                      newPdfStyle.fontSize.title = preset.sizes.title;
                      newPdfStyle.fontSize.section = preset.sizes.sectionTitle;
                      newPdfStyle.fontSize.field = preset.sizes.fieldValue;

                      // Update header and footer font sizes
                      if (newPdfStyle.header) {
                        newPdfStyle.header.fontSize = preset.sizes.title;
                      }
                      if (newPdfStyle.footer) {
                        newPdfStyle.footer.fontSize = preset.sizes.fieldLabel;
                      }

                      return {
                        ...prev,
                        sections: newSections,
                        pdfStyle: newPdfStyle
                      };
                    });
                    showSuccess(t('templates.presetApplied'));
                  }}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/10 transition-all font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {t('templates.presetDescription')}
            </p>
          </Card>

          {/* Section Styling Controls */}
          <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaPalette />
              {t('templates.sectionStyling')}
            </h3>
            <div className="space-y-6">
              {/* Show/Hide Section Title */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(() => {
                      // Get the actual value from formData, not from the default advancedLayout
                      const actualSection = formData.sections[selectedSectionIndex];
                      const actualStyling = actualSection?.advancedLayout?.styling;
                      if (actualStyling && actualStyling.showTitle !== undefined) {
                        return actualStyling.showTitle;
                      }
                      // Default to true if not set
                      return true;
                    })()}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      console.log('[TemplateBuilder] Toggling showTitle to:', newValue);
                      updateAdvancedLayout('styling.showTitle', newValue);
                    }}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">{t('templates.showSectionTitle')}</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  {t('templates.showSectionTitleHint')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('templates.sectionTitleColor')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={advancedLayout.styling?.titleColor || currentSection.pdfStyle?.titleColor || '#000000'}
                      onChange={(e) => updateAdvancedLayout('styling.titleColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={advancedLayout.styling?.titleColor || currentSection.pdfStyle?.titleColor || '#000000'}
                      onChange={(e) => updateAdvancedLayout('styling.titleColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('templates.sectionTitleFontSize')} (px)
                  </label>
                  <input
                    type="number"
                    value={advancedLayout.styling?.titleFontSize ?? currentSection.pdfStyle?.titleFontSize ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 20);
                      updateAdvancedLayout('styling.titleFontSize', val);
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        updateAdvancedLayout('styling.titleFontSize', currentSection.pdfStyle?.titleFontSize || 20);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="8"
                    max="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('templates.sectionBackgroundColor')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={advancedLayout.styling?.backgroundColor || currentSection.pdfStyle?.backgroundColor || '#ffffff'}
                      onChange={(e) => updateAdvancedLayout('styling.backgroundColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={advancedLayout.styling?.backgroundColor || currentSection.pdfStyle?.backgroundColor || '#ffffff'}
                      onChange={(e) => updateAdvancedLayout('styling.backgroundColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('templates.sectionTextColor')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={advancedLayout.styling?.textColor || currentSection.pdfStyle?.textColor || '#000000'}
                      onChange={(e) => updateAdvancedLayout('styling.textColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={advancedLayout.styling?.textColor || currentSection.pdfStyle?.textColor || '#000000'}
                      onChange={(e) => updateAdvancedLayout('styling.textColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('templates.sectionBorderColor')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={advancedLayout.styling?.borderColor || currentSection.pdfStyle?.borderColor || '#e5e7eb'}
                      onChange={(e) => updateAdvancedLayout('styling.borderColor', e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={advancedLayout.styling?.borderColor || currentSection.pdfStyle?.borderColor || '#e5e7eb'}
                      onChange={(e) => updateAdvancedLayout('styling.borderColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Field Styling Controls */}
          <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaFont />
              {t('templates.fieldStyling')}
            </h3>
            <div className="space-y-4">
              {currentSection.fields.map((field, fIdx) => (
                <div key={field.key} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="font-medium text-gray-700 mb-2">
                    {isRTL ? field.label.ar || field.label.en : field.label.en || field.label.ar}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.fieldLabelColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={field.layout?.labelColor || field.pdfDisplay?.labelColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                                newSections[selectedSectionIndex].fields[fIdx].layout = {};
                              }
                              newSections[selectedSectionIndex].fields[fIdx].layout.labelColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={field.layout?.labelColor || field.pdfDisplay?.labelColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                                newSections[selectedSectionIndex].fields[fIdx].layout = {};
                              }
                              newSections[selectedSectionIndex].fields[fIdx].layout.labelColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.fieldLabelFontSize')} (px)
                      </label>
                      <input
                        type="number"
                        value={field.layout?.labelFontSize || field.pdfDisplay?.labelFontSize || 12}
                        onChange={(e) => {
                          setFormData(prev => {
                            const newSections = [...prev.sections];
                            if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                              newSections[selectedSectionIndex].fields[fIdx].layout = {};
                            }
                            const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 12);
                            newSections[selectedSectionIndex].fields[fIdx].layout.labelFontSize = val;
                            return { ...prev, sections: newSections };
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min="8"
                        max="72"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.fieldValueColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={field.layout?.valueColor || field.pdfDisplay?.valueColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                                newSections[selectedSectionIndex].fields[fIdx].layout = {};
                              }
                              newSections[selectedSectionIndex].fields[fIdx].layout.valueColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={field.layout?.valueColor || field.pdfDisplay?.valueColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                                newSections[selectedSectionIndex].fields[fIdx].layout = {};
                              }
                              newSections[selectedSectionIndex].fields[fIdx].layout.valueColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.fieldValueFontSize')} (px)
                      </label>
                      <input
                        type="number"
                        value={field.layout?.valueFontSize ?? field.pdfDisplay?.fontSize ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 16);
                          setFormData(prev => {
                            const newSections = [...prev.sections];
                            if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                              newSections[selectedSectionIndex].fields[fIdx].layout = {};
                            }
                            newSections[selectedSectionIndex].fields[fIdx].layout.valueFontSize = val;
                            if (!newSections[selectedSectionIndex].fields[fIdx].pdfDisplay) {
                              newSections[selectedSectionIndex].fields[fIdx].pdfDisplay = {};
                            }
                            newSections[selectedSectionIndex].fields[fIdx].pdfDisplay.fontSize = val;
                            return { ...prev, sections: newSections };
                          });
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                                newSections[selectedSectionIndex].fields[fIdx].layout = {};
                              }
                              const defaultValue = field.pdfDisplay?.fontSize || 16;
                              newSections[selectedSectionIndex].fields[fIdx].layout.valueFontSize = defaultValue;
                              if (!newSections[selectedSectionIndex].fields[fIdx].pdfDisplay) {
                                newSections[selectedSectionIndex].fields[fIdx].pdfDisplay = {};
                              }
                              newSections[selectedSectionIndex].fields[fIdx].pdfDisplay.fontSize = defaultValue;
                              return { ...prev, sections: newSections };
                            });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min="8"
                        max="72"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.fieldBackgroundColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={field.layout?.backgroundColor || '#ffffff'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                                newSections[selectedSectionIndex].fields[fIdx].layout = {};
                              }
                              newSections[selectedSectionIndex].fields[fIdx].layout.backgroundColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={field.layout?.backgroundColor || '#ffffff'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].fields[fIdx].layout) {
                                newSections[selectedSectionIndex].fields[fIdx].layout = {};
                              }
                              newSections[selectedSectionIndex].fields[fIdx].layout.backgroundColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Table Styling Controls */}
          {advancedLayout.layoutType === 'table' && advancedLayout.table?.enabled && (
            <Card>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaTable />
                {t('templates.tableStyling')}
              </h3>
              <div className="space-y-6">
                {/* Table Rows Configuration */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">{t('templates.tableRows')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.numberOfRows')}
                      </label>
                      <input
                        type="number"
                        value={advancedLayout.table.numberOfRows ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 10);
                          updateAdvancedLayout('table.numberOfRows', val);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updateAdvancedLayout('table.numberOfRows', 10);
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min="1"
                        max="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('templates.numberOfRowsHint')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.borderStyle')}
                      </label>
                      <select
                        value={advancedLayout.table.borderStyle || 'solid'}
                        onChange={(e) => {
                          updateAdvancedLayout('table.borderStyle', e.target.value);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="solid">{t('templates.solid')}</option>
                        <option value="dashed">{t('templates.dashed')}</option>
                        <option value="dotted">{t('templates.dotted')}</option>
                        <option value="double">{t('templates.double')}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">{t('templates.tableHeader')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.headerBackgroundColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={advancedLayout.table.headerStyle?.backgroundColor || '#f3f4f6'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.headerStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.headerStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.headerStyle.backgroundColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={advancedLayout.table.headerStyle?.backgroundColor || '#f3f4f6'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.headerStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.headerStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.headerStyle.backgroundColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="#f3f4f6"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.headerTextColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={advancedLayout.table.headerStyle?.textColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.headerStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.headerStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.headerStyle.textColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={advancedLayout.table.headerStyle?.textColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.headerStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.headerStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.headerStyle.textColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.headerFontSize')} (px)
                      </label>
                      <input
                        type="number"
                        value={advancedLayout.table.headerStyle?.fontSize ?? ''}
                        onChange={(e) => {
                          setFormData(prev => {
                            const newSections = [...prev.sections];
                            if (!newSections[selectedSectionIndex].advancedLayout.table.headerStyle) {
                              newSections[selectedSectionIndex].advancedLayout.table.headerStyle = {};
                            }
                            const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 18);
                            newSections[selectedSectionIndex].advancedLayout.table.headerStyle.fontSize = val;
                            return { ...prev, sections: newSections };
                          });
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.headerStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.headerStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.headerStyle.fontSize = 18;
                              return { ...prev, sections: newSections };
                            });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min="8"
                        max="72"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">{t('templates.tableCells')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.cellBackgroundColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={advancedLayout.table.cellStyle?.backgroundColor || '#ffffff'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.cellStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.cellStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.cellStyle.backgroundColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={advancedLayout.table.cellStyle?.backgroundColor || '#ffffff'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.cellStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.cellStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.cellStyle.backgroundColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.cellTextColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={advancedLayout.table.cellStyle?.textColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.cellStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.cellStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.cellStyle.textColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={advancedLayout.table.cellStyle?.textColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.cellStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.cellStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.cellStyle.textColor = e.target.value;
                              return { ...prev, sections: newSections };
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('templates.cellFontSize')} (px)
                      </label>
                      <input
                        type="number"
                        value={advancedLayout.table.cellStyle?.fontSize ?? ''}
                        onChange={(e) => {
                          setFormData(prev => {
                            const newSections = [...prev.sections];
                            if (!newSections[selectedSectionIndex].advancedLayout.table.cellStyle) {
                              newSections[selectedSectionIndex].advancedLayout.table.cellStyle = {};
                            }
                            const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 16);
                            newSections[selectedSectionIndex].advancedLayout.table.cellStyle.fontSize = val;
                            return { ...prev, sections: newSections };
                          });
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setFormData(prev => {
                              const newSections = [...prev.sections];
                              if (!newSections[selectedSectionIndex].advancedLayout.table.cellStyle) {
                                newSections[selectedSectionIndex].advancedLayout.table.cellStyle = {};
                              }
                              newSections[selectedSectionIndex].advancedLayout.table.cellStyle.fontSize = 16;
                              return { ...prev, sections: newSections };
                            });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min="8"
                        max="72"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Preview Tab Component
const PreviewTab = ({ formData, isRTL, t }) => {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('templates.preview')}</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 min-h-[600px]">
          {/* Preview Header */}
          {formData.pdfStyle.header.enabled && (
            <div
              className="mb-6 p-4 rounded-lg relative"
              style={{
                backgroundColor: formData.pdfStyle.header.backgroundColor,
                color: formData.pdfStyle.header.textColor,
                minHeight: `${formData.pdfStyle.header.height}px`
              }}
            >
              <div className="flex items-center justify-between">
                {/* Logo - Position based on logoPosition */}
                {formData.pdfStyle.header.showLogo && (
                  <div
                    className={`w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-white font-bold ${formData.pdfStyle.header.logoPosition === 'right' ? 'order-3' :
                      formData.pdfStyle.header.logoPosition === 'center' ? 'order-2 mx-auto' : 'order-1'
                      }`}
                  >
                    {formData.pdfStyle.branding?.logoUrl ? (
                      <img src={formData.pdfStyle.branding.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-lg" />
                    )}
                  </div>
                )}

                {/* Title - Decorative or Normal */}
                {formData.pdfStyle.header.showTitle && (
                  <div className={`flex-1 ${formData.pdfStyle.header.logoPosition === 'right' ? 'order-1 text-left' : formData.pdfStyle.header.logoPosition === 'center' ? 'order-1 text-center' : 'order-2 text-right'} ${isRTL ? 'text-right' : 'text-left'}`}>
                    {formData.pdfStyle.header.titleStyle === 'decorative' ? (
                      <div className="flex items-center justify-center gap-4">
                        <div
                          className="h-1 flex-1"
                          style={{ backgroundColor: formData.pdfStyle.header.decorativeLineColor || '#d4b900', maxWidth: '48px' }}
                        ></div>
                        <h2
                          className="text-xl font-bold px-4"
                          style={{ color: formData.pdfStyle.header.titleColor || '#d4b900' }}
                        >
                          {formData.title[isRTL ? 'ar' : 'en']}
                        </h2>
                        <div
                          className="h-1 flex-1"
                          style={{ backgroundColor: formData.pdfStyle.header.decorativeLineColor || '#d4b900', maxWidth: '48px' }}
                        ></div>
                      </div>
                    ) : (
                      <h2
                        className="text-xl font-bold"
                        style={{ color: formData.pdfStyle.header.titleColor || formData.pdfStyle.header.textColor }}
                      >
                        {formData.title[isRTL ? 'ar' : 'en']}
                      </h2>
                    )}

                    {/* Subtitle */}
                    {formData.pdfStyle.header.showSubtitle && formData.pdfStyle.header.subtitle && (
                      <p className="text-sm mt-1" style={{ color: formData.pdfStyle.header.textColor }}>
                        {formData.pdfStyle.header.subtitle[isRTL ? 'ar' : 'en']}
                      </p>
                    )}
                  </div>
                )}

                {/* Date */}
                {formData.pdfStyle.header.showDate && (
                  <div className={`text-sm ${formData.pdfStyle.header.logoPosition === 'right' ? 'order-2' : 'order-3'}`}>
                    {new Date().toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Sections */}
          {formData.sections
            .filter(section => section.visible !== false)
            .map((section, sIdx) => {
              const advancedLayout = section.advancedLayout || {};
              const layoutType = advancedLayout.layoutType || 'simple';
              const sectionStyle = section.pdfStyle || {};

              // Debug: Log layout info for troubleshooting
              if (process.env.NODE_ENV === 'development') {
                console.log('Section layout:', {
                  sectionId: section.id,
                  layoutType,
                  hasTable: !!advancedLayout.table,
                  tableEnabled: advancedLayout.table?.enabled,
                  hasColumns: !!advancedLayout.columns,
                  columnsEnabled: advancedLayout.columns?.enabled
                });
              }

              // Get fields in order
              let fieldsToRender = section.fields || [];
              fieldsToRender = fieldsToRender.filter(field => field.visible !== false);
              fieldsToRender.sort((a, b) => (a.order || 0) - (b.order || 0));

              return (
                <div
                  key={section.id}
                  className="mb-6 rounded-lg border"
                  style={{
                    backgroundColor: advancedLayout.styling?.backgroundColor || (sectionStyle.showBackground ? sectionStyle.backgroundColor : 'transparent'),
                    borderColor: advancedLayout.styling?.borderColor || (sectionStyle.showBorder !== false ? sectionStyle.borderColor : 'transparent'),
                    borderWidth: sectionStyle.showBorder !== false ? `${sectionStyle.borderWidth || 1}px` : '0',
                    color: advancedLayout.styling?.textColor || sectionStyle.textColor || '#000000',
                    padding: `${advancedLayout.padding?.top || sectionStyle.padding || 10}px ${advancedLayout.padding?.right || sectionStyle.padding || 10}px ${advancedLayout.padding?.bottom || sectionStyle.padding || 10}px ${advancedLayout.padding?.left || sectionStyle.padding || 10}px`,
                    marginTop: `${advancedLayout.margins?.top || sectionStyle.marginTop || 10}px`,
                    marginBottom: `${advancedLayout.margins?.bottom || sectionStyle.marginBottom || 10}px`,
                    width: advancedLayout.sizing?.width || '100%',
                    maxWidth: advancedLayout.sizing?.maxWidth || '100%'
                  }}
                >
                  {advancedLayout.styling?.showTitle !== false && (
                    <h3
                      className="font-semibold mb-3"
                      style={{
                        color: advancedLayout.styling?.titleColor || sectionStyle.titleColor || '#000000',
                        fontSize: `${advancedLayout.styling?.titleFontSize || sectionStyle.titleFontSize || 20}px`
                      }}
                    >
                      {section.label[isRTL ? 'ar' : 'en']}
                    </h3>
                  )}

                  {/* Table Layout */}
                  {layoutType === 'table' && advancedLayout.table && (advancedLayout.table.enabled !== false) && (
                    <div className="overflow-x-auto">
                      <table
                        className="w-full border-collapse"
                        style={{
                          borderStyle: advancedLayout.table.borderStyle || 'solid',
                          borderColor: advancedLayout.table.showBorders ? (advancedLayout.table.borderColor || advancedLayout.styling?.borderColor || sectionStyle.borderColor || '#e5e7eb') : 'transparent',
                          borderWidth: advancedLayout.table.showBorders ? `${advancedLayout.table.borderWidth || 1}px` : '0'
                        }}
                      >
                        {advancedLayout.table.showHeader && advancedLayout.table.columns && advancedLayout.table.columns.length > 0 && (
                          <thead>
                            <tr
                              style={{
                                backgroundColor: advancedLayout.table.headerStyle?.backgroundColor || formData.pdfStyle.colors?.border || '#f3f4f6'
                              }}
                            >
                              {advancedLayout.table.columns.map((col, colIdx) => (
                                <th
                                  key={col.id || colIdx}
                                  className="px-4 py-2 text-left font-semibold border"
                                  style={{
                                    width: col.width === 'auto' ? 'auto' : col.width,
                                    textAlign: col.alignment || 'left',
                                    borderColor: advancedLayout.table.showBorders ? (advancedLayout.styling?.borderColor || sectionStyle.borderColor || '#e5e7eb') : 'transparent',
                                    borderWidth: advancedLayout.table.showBorders ? '1px' : '0',
                                    backgroundColor: advancedLayout.table.headerStyle?.backgroundColor || formData.pdfStyle.colors?.border || '#f3f4f6',
                                    color: advancedLayout.table.headerStyle?.textColor || '#000000',
                                    fontSize: `${advancedLayout.table.headerStyle?.fontSize || 14}px`
                                  }}
                                >
                                  {col.label?.[isRTL ? 'ar' : 'en'] || col.label?.en || col.label?.ar || 'Column'}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {advancedLayout.table.dynamicRows ? (
                            // Dynamic rows - show sample data
                            <tr className={advancedLayout.table.stripedRows ? 'bg-gray-50' : ''}>
                              {advancedLayout.table.columns.map((col, colIdx) => {
                                const field = fieldsToRender.find(f => f.key === col.fieldKey);
                                return (
                                  <td
                                    key={col.id || colIdx}
                                    className="px-4 py-2 border"
                                    style={{
                                      textAlign: col.alignment || 'left',
                                      borderColor: advancedLayout.table.showBorders ? (advancedLayout.styling?.borderColor || sectionStyle.borderColor || '#e5e7eb') : 'transparent',
                                      borderWidth: advancedLayout.table.showBorders ? '1px' : '0',
                                      backgroundColor: advancedLayout.table.cellStyle?.backgroundColor || '#ffffff',
                                      color: advancedLayout.table.cellStyle?.textColor || '#000000',
                                      fontSize: `${advancedLayout.table.cellStyle?.fontSize || 12}px`
                                    }}
                                  >
                                    {field ? (
                                      <span>
                                        {field.type === 'text' && 'Sample text...'}
                                        {field.type === 'number' && '123'}
                                        {field.type === 'boolean' && 'Yes'}
                                        {field.type === 'date' && '2025-01-01'}
                                        {field.type === 'time' && '12:00'}
                                        {field.type === 'datetime' && '2025-01-01 12:00'}
                                      </span>
                                    ) : '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          ) : (
                            // Static rows - show empty rows for data entry
                            Array.from({ length: advancedLayout.table.numberOfRows || 10 }).map((_, rowIdx) => (
                              <tr
                                key={rowIdx}
                                className={advancedLayout.table.stripedRows && rowIdx % 2 === 1 ? 'bg-gray-50' : ''}
                              >
                                {advancedLayout.table.columns && advancedLayout.table.columns.length > 0 ? (
                                  advancedLayout.table.columns.map((col, colIdx) => {
                                    // For first row, show field labels if available
                                    const field = fieldsToRender.find(f => f.key === col.fieldKey);
                                    return (
                                      <td
                                        key={`${rowIdx}-${col.id || colIdx}`}
                                        className="px-4 py-2"
                                        style={{
                                          textAlign: col.alignment || 'left',
                                          borderStyle: advancedLayout.table.borderStyle || 'solid',
                                          borderColor: advancedLayout.table.showBorders ? (advancedLayout.table.borderColor || advancedLayout.styling?.borderColor || sectionStyle.borderColor || '#e5e7eb') : 'transparent',
                                          borderWidth: advancedLayout.table.showBorders ? `${advancedLayout.table.borderWidth || 1}px` : '0',
                                          backgroundColor: advancedLayout.table.cellStyle?.backgroundColor || '#ffffff',
                                          color: advancedLayout.table.cellStyle?.textColor || '#000000',
                                          fontSize: `${advancedLayout.table.cellStyle?.fontSize || 12}px`,
                                          minHeight: '40px'
                                        }}
                                      >
                                        {rowIdx === 0 && field ? (
                                          <div>
                                            <div
                                              className="font-medium mb-1"
                                              style={{
                                                color: field.layout?.labelColor || field.pdfDisplay?.labelColor || '#666666',
                                                fontSize: `${field.layout?.labelFontSize || field.pdfDisplay?.labelFontSize || 12}px`
                                              }}
                                            >
                                              {field.label[isRTL ? 'ar' : 'en']}
                                            </div>
                                            <div
                                              style={{
                                                color: field.layout?.valueColor || field.pdfDisplay?.valueColor || '#000000',
                                                fontSize: `${field.layout?.valueFontSize || field.pdfDisplay?.fontSize || 14}px`
                                              }}
                                            >
                                              {field.type === 'text' && 'Text input...'}
                                              {field.type === 'textarea' && 'Textarea input...'}
                                              {field.type === 'number' && '123'}
                                              {field.type === 'boolean' && 'Yes/No'}
                                              {field.type === 'select' && 'Select option...'}
                                              {field.type === 'date' && 'Date picker...'}
                                              {field.type === 'time' && 'Time picker...'}
                                              {field.type === 'datetime' && 'DateTime picker...'}
                                              {field.type === 'file' && 'File upload...'}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">&nbsp;</span>
                                        )}
                                      </td>
                                    );
                                  })
                                ) : (
                                  // No columns defined, show fields in simple table
                                  fieldsToRender.map((field, fIdx) => (
                                    <td
                                      key={`${rowIdx}-${field.key}`}
                                      className="px-4 py-2 text-sm"
                                      style={{
                                        borderStyle: advancedLayout.table.borderStyle || 'solid',
                                        borderColor: advancedLayout.table.showBorders ? (sectionStyle.borderColor || '#e5e7eb') : 'transparent',
                                        borderWidth: advancedLayout.table.showBorders ? `${advancedLayout.table.borderWidth || 1}px` : '0',
                                        minHeight: '40px'
                                      }}
                                    >
                                      {rowIdx === 0 ? (
                                        <div>
                                          <div className="font-medium text-xs text-gray-500 mb-1">
                                            {field.label[isRTL ? 'ar' : 'en']}
                                          </div>
                                          <div className="text-gray-700">
                                            {field.type === 'text' && 'Text input...'}
                                            {field.type === 'textarea' && 'Textarea input...'}
                                            {field.type === 'number' && '123'}
                                            {field.type === 'boolean' && 'Yes/No'}
                                            {field.type === 'select' && 'Select option...'}
                                            {field.type === 'date' && 'Date picker...'}
                                            {field.type === 'time' && 'Time picker...'}
                                            {field.type === 'datetime' && 'DateTime picker...'}
                                            {field.type === 'file' && 'File upload...'}
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-gray-300">&nbsp;</span>
                                      )}
                                    </td>
                                  ))
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Columns Layout */}
                  {layoutType === 'columns' && advancedLayout.columns?.enabled && (
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: advancedLayout.columns.equalWidths
                          ? `repeat(${advancedLayout.columns.columnCount || 2}, 1fr)`
                          : advancedLayout.columns.columnWidths?.join(' ') || `repeat(${advancedLayout.columns.columnCount || 2}, 1fr)`,
                        gap: `${advancedLayout.columns.columnGap || 20}px`
                      }}
                    >
                      {fieldsToRender.map((field, fIdx) => (
                        <div key={field.key}>
                          <label
                            className="block font-medium mb-1"
                            style={{
                              color: field.layout?.labelColor || field.pdfDisplay?.labelColor || '#000000',
                              fontSize: `${field.layout?.labelFontSize || field.pdfDisplay?.labelFontSize || 12}px`
                            }}
                          >
                            {field.label[isRTL ? 'ar' : 'en']}
                            {field.required && <span className="text-primary ml-1">*</span>}
                          </label>
                          <div
                            className="px-3 py-2 border border-gray-300 rounded"
                            style={{
                              backgroundColor: field.layout?.backgroundColor || '#ffffff',
                              color: field.layout?.valueColor || field.pdfDisplay?.valueColor || '#666666',
                              fontSize: `${field.layout?.valueFontSize || field.pdfDisplay?.fontSize || 14}px`
                            }}
                          >
                            {field.type === 'text' && 'Text input...'}
                            {field.type === 'textarea' && 'Textarea input...'}
                            {field.type === 'number' && '123'}
                            {field.type === 'boolean' && 'Yes/No'}
                            {field.type === 'select' && 'Select option...'}
                            {field.type === 'date' && 'Date picker...'}
                            {field.type === 'time' && 'Time picker...'}
                            {field.type === 'datetime' && 'DateTime picker...'}
                            {field.type === 'file' && 'File upload...'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grid Layout */}
                  {layoutType === 'grid' && advancedLayout.grid?.enabled && (
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: advancedLayout.grid.template || `repeat(${advancedLayout.grid.columns || 1}, 1fr)`,
                        gridTemplateRows: `repeat(${advancedLayout.grid.rows || 1}, auto)`,
                        gap: `${advancedLayout.grid.gap || 10}px`
                      }}
                    >
                      {fieldsToRender.map((field, fIdx) => (
                        <div key={field.key}>
                          <label
                            className="block font-medium mb-1"
                            style={{
                              color: field.layout?.labelColor || field.pdfDisplay?.labelColor || '#000000',
                              fontSize: `${field.layout?.labelFontSize || field.pdfDisplay?.labelFontSize || 12}px`
                            }}
                          >
                            {field.label[isRTL ? 'ar' : 'en']}
                            {field.required && <span className="text-primary ml-1">*</span>}
                          </label>
                          <div
                            className="px-3 py-2 border border-gray-300 rounded"
                            style={{
                              backgroundColor: field.layout?.backgroundColor || '#ffffff',
                              color: field.layout?.valueColor || field.pdfDisplay?.valueColor || '#666666',
                              fontSize: `${field.layout?.valueFontSize || field.pdfDisplay?.fontSize || 14}px`
                            }}
                          >
                            {field.type === 'text' && 'Text input...'}
                            {field.type === 'textarea' && 'Textarea input...'}
                            {field.type === 'number' && '123'}
                            {field.type === 'boolean' && 'Yes/No'}
                            {field.type === 'select' && 'Select option...'}
                            {field.type === 'date' && 'Date picker...'}
                            {field.type === 'time' && 'Time picker...'}
                            {field.type === 'datetime' && 'DateTime picker...'}
                            {field.type === 'file' && 'File upload...'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Simple Layout (default) - Show if no other layout is active */}
                  {(!layoutType || layoutType === 'simple' || (layoutType === 'table' && (!advancedLayout.table || advancedLayout.table.enabled === false)) || (layoutType === 'columns' && (!advancedLayout.columns || advancedLayout.columns.enabled === false)) || (layoutType === 'grid' && (!advancedLayout.grid || advancedLayout.grid.enabled === false))) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fieldsToRender.map((field, fIdx) => (
                        <div key={field.key} className={`${field.width === 'full' ? 'md:col-span-2' : field.width === 'half' ? 'md:col-span-1' : ''}`}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label[isRTL ? 'ar' : 'en']}
                            {field.required && <span className="text-primary ml-1">*</span>}
                          </label>
                          <div className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-500">
                            {field.type === 'text' && 'Text input...'}
                            {field.type === 'textarea' && 'Textarea input...'}
                            {field.type === 'number' && '123'}
                            {field.type === 'boolean' && 'Yes/No'}
                            {field.type === 'select' && 'Select option...'}
                            {field.type === 'date' && 'Date picker...'}
                            {field.type === 'time' && 'Time picker...'}
                            {field.type === 'datetime' && 'DateTime picker...'}
                            {field.type === 'file' && 'File upload...'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Preview Footer */}
          {formData.pdfStyle.footer.enabled && (
            <div
              className="mt-6 p-4 rounded-lg text-sm"
              style={{
                backgroundColor: formData.pdfStyle.footer.backgroundColor,
                color: formData.pdfStyle.footer.textColor,
                minHeight: `${formData.pdfStyle.footer.height}px`
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Company Name and Social Icons */}
                <div className="flex-1">
                  {formData.pdfStyle.footer.showCompanyInfo && (
                    <div className="font-bold mb-1">{formData.pdfStyle.footer.companyName || 'atsha'}</div>
                  )}
                  {formData.pdfStyle.footer.showSocialIcons && (
                    <div className="flex gap-2 text-xs">
                      <span>📧</span>
                      <span>📱</span>
                      <span>🌐</span>
                      <span>📍</span>
                      <span>📞</span>
                      <span>✉️</span>
                      <span>📠</span>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                {formData.pdfStyle.footer.showQRCode && (
                  <div
                    className={`flex items-center justify-center ${formData.pdfStyle.footer.qrCodePosition === 'left' ? 'order-first' :
                      formData.pdfStyle.footer.qrCodePosition === 'right' ? 'order-last' : ''
                      }`}
                  >
                    <div className="w-12 h-12 bg-white rounded flex items-center justify-center border-2 border-gray-300">
                      <FaQrcode className="text-2xl" style={{ color: formData.pdfStyle.footer.backgroundColor || '#d4b900' }} />
                    </div>
                  </div>
                )}

                {/* Phone Number */}
                {formData.pdfStyle.footer.showPhoneNumber && formData.pdfStyle.footer.phoneNumber && (
                  <div className="flex items-center gap-2 font-bold">
                    <FaPhone className="text-lg" />
                    <span>{formData.pdfStyle.footer.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Footer Content */}
              {formData.pdfStyle.footer.content?.[isRTL ? 'ar' : 'en'] && (
                <div className="mt-2 text-center">
                  {formData.pdfStyle.footer.content[isRTL ? 'ar' : 'en']}
                </div>
              )}

              {/* Page Numbers */}
              {formData.pdfStyle.footer.showPageNumbers && (
                <div className="mt-2 text-center">Page 1</div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TemplateBuilder;