import { useNavigate } from 'react-router-dom'

export default function PilotBanner() {
  const navigate = useNavigate()

  return (
    <div className="pilot-banner-container" style={{
      background: 'linear-gradient(135deg, #5a1f3f 0%, #8b2f5e 50%, #b01a2c 100%)',
      padding: '24px 28px',
      margin: '24px auto',
      maxWidth: '1200px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px',
      boxShadow: '0 8px 32px rgba(90, 31, 63, 0.25)',
      flexWrap: 'wrap',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-5%',
        width: '200px',
        height: '200px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div className="pilot-banner-content" style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0, zIndex: 1 }}>

        <div style={{ minWidth: 0 }}>
          <div className="pilot-banner-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>
              FASE DE PRUEBA
            </h3>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              RKvinos
            </span>
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: '1.5', maxWidth: '600px' }}>
            Actualmente, nuestra plataforma se encuentra en fase de prueba, por lo que pueden presentarse errores o aspectos por mejorar. Tu opinión es fundamental para ayudarnos a identificar oportunidades de mejora y ofrecerte una experiencia cada vez mejor. ¡Gracias por tu colaboración!
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/pilot-feedback')}
        style={{
          background: '#fff',
          color: '#5a1f3f',
          border: 'none',
          padding: '14px 28px',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.3s ease',
          flexShrink: 0,
          width: 'fit-content',
          zIndex: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-3px) scale(1.02)'
          e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)'
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        Ayudanos a mejorar →
      </button>

      <style>{`
        @media (max-width: 768px) {
          .pilot-banner-container {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            padding: 20px !important;
            margin-left: 32px !important;
            margin-right: 32px !important;
          }
          .pilot-banner-content {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
          .pilot-banner-header {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
          }
        }
      `}</style>
    </div>
  )
}
