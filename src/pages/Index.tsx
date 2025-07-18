import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para o catálogo
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
