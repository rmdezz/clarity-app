import { ITenant } from '@/entities/tenant/model/types';
import { Mail, Users } from 'lucide-react'; // Iconos

interface TenantDetailsProps {
  tenant: ITenant;
}

export const TenantDetails = ({ tenant }: TenantDetailsProps) => {
  return (
    <div className="flex items-center space-x-4 text-neutral-800">
      <div>
        <p className="font-semibold">{tenant.name}</p>
        <div className="flex items-center text-sm text-neutral-500">
          <Mail className="w-3 h-3 mr-1" />
          <span>{tenant.email}</span>
        </div>
        <div className="flex items-center text-sm text-neutral-500">
          <Users className="w-3 h-3 mr-1" />
          <span>{tenant.number_of_occupants} ocupantes</span>
        </div>
      </div>
    </div>
  );
};