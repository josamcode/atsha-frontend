import React from 'react'
import { useTranslation } from 'react-i18next'

const CompantStamp = ({ color = 'blue' }) => {
  const { t } = useTranslation()
  return (
    <div className="inline-block absolute left-1/4 transform -translate-x-1/2" >
      <div className="border border-blue-300 outline outline-1 outline-blue-200 outline-offset-2 rotate-[-7deg] bg-blue-50 flex scale-90">
        <div className="flex items-center justify-center px-3 border-l border-blue-300">
          <img src="/logo.png" alt="Company Logo" className="w-16 h-auto" />
        </div>

        <div className="flex flex-col items-center justify-center text-center gap-1 py-2 px-3">
          <p className="text-xs font-bold text-blue-600">{t('users.atshaForFoodDelivery')}</p>
          <p className="text-[10px] text-blue-500">{t('users.humanResourcesDepartment')}</p>
        </div>
      </div>
    </div >
  )
}

export default CompantStamp;