import React from 'react';
import { Shield, Users, Trophy, Calendar, PlusCircle, CheckCircle, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  const adminSections = [
    {
      title: 'Campeonatos',
      description: 'Crea y gestiona los campeonatos',
      icon: <LayoutGrid className="h-8 w-8 text-orange-600" />,
      link: '/admin/campeonatos',
      color: 'bg-orange-50'
    },
    {
      title: 'Crear Equipo',
      description: 'Registra nuevos equipos en el sistema',
      icon: <Users className="h-8 w-8 text-green-600" />,
      link: '/admin/crear-equipo',
      color: 'bg-green-50'
    },
    {
      title: 'Crear Grupo',
      description: 'Organiza equipos en grupos',
      icon: <Calendar className="h-8 w-8 text-yellow-600" />,
      link: '/admin/crear-grupo',
      color: 'bg-yellow-50'
    },
    {
      title: 'Crear Partido',
      description: 'Programa nuevos partidos',
      icon: <PlusCircle className="h-8 w-8 text-purple-600" />,
      link: '/admin/crear-partido',
      color: 'bg-purple-50'
    },
    {
      title: 'Inscribir Usuarios',
      description: 'Agrega usuarios a quinielas',
      icon: <Users className="h-8 w-8 text-blue-600" />,
      link: '/admin/inscribir-usuario',
      color: 'bg-blue-50'
    },
    {
      title: 'Registrar Resultados',
      description: 'Ingresa los resultados de los partidos y calcula puntos automáticamente',
      icon: <CheckCircle className="h-8 w-8 text-green-600" />,
      link: '/admin/resultados',
      color: 'bg-green-50'
    }
  ];

  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-8">
        <div className="flex items-center">
          <Shield className="h-12 w-12 mr-4" />
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="mt-2">Gestiona campeonatos, quinielas, equipos, grupos, resultados y más</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section, index) => (
          <Link
            key={index}
            to={section.link}
            className={`${section.color} rounded-lg shadow-md p-6 hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
              {section.icon}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;