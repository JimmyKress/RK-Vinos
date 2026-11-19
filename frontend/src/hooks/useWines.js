import { useState, useEffect } from 'react';
import { getAllWines, getAllWinesAdmin } from '../api/axiosDrinks.js';

export function useWines() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllWines();
      setWines(data);
    } catch (err) {
      setError(err.message || 'Error al cargar los vinos');
      console.error('Error fetching wines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWines();
  }, []);

  const refetch = () => {
    fetchWines();
  };

  return { wines, loading, error, refetch };
}

export function useWinesAdmin() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllWinesAdmin();
      setWines(data);
    } catch (err) {
      setError(err.message || 'Error al cargar los vinos');
      console.error('Error fetching wines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWines();
  }, []);

  const refetch = () => {
    fetchWines();
  };

  return { wines, loading, error, refetch };
}
