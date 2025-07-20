// frontend/src/features/tenancy-management/ui/TenancyManagement.tsx

'use client';

import { useState } from 'react';
import { useTenancies } from '@/entities/tenancy/model/hooks';
import { TenancyList } from './TenancyList';
import { TenancyCreateForm } from './TenancyCreateForm';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon } from 'lucide-react';

interface TenancyManagementProps {
  unitId: number;
  unitName: string;
}

export function TenancyManagement({ unitId, unitName }: TenancyManagementProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [isCreating, setIsCreating] = useState(false);
  
  console.log('TenancyManagement props:', { unitId, unitName });
  
  const { data: tenancies, isLoading, error } = useTenancies(unitId);

  const handleCreateSuccess = () => {
    setIsCreating(false);
    setActiveTab('list');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando arrendamientos...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error al cargar arrendamientos: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gestión de Arrendamientos - {unitName}</CardTitle>
          {!isCreating && (
            <Button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nuevo Arrendamiento
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isCreating ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Crear Nuevo Arrendamiento</h3>
              <Button 
                variant="outline" 
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </Button>
            </div>
            <TenancyCreateForm 
              unitId={unitId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list">Arrendamientos Actuales</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-4">
              <TenancyList 
                tenancies={tenancies || []} 
                showActiveOnly={true}
              />
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <TenancyList 
                tenancies={tenancies || []} 
                showActiveOnly={false}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}