import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getWineComments, createWineComment, deleteWineComment } from '../api/axiosDrinks.js'

function Avatar({ user, size = 40 }) {
  if (user?.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt={user.user_name || user.name || ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  const initial = (user?.user_name || user?.name || 'U').charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#5a1f3f,#b01a2c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38
    }}>{initial}</div>
  )
}

export default function WineComments({ slug }) {
  const { user } = useAuth()
  const [comments, setComments]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [text, setText]               = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [editing, setEditing]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  const fetchComments = useCallback(async () => {
    try {
      const data = await getWineComments(slug)
      setComments(data)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchComments() }, [fetchComments])

  // detectar si el usuario ya comentó
  const myComment = user
    ? comments.find(c => String(c.user_id) === String(user.id))
    : null
  const hasComment = !!myComment

  // precargar al detectar comentario propio
  useEffect(() => {
    if (myComment && !editing) {
      setText(myComment.comment)
    }
  }, [myComment?.id])

  function startEdit() {
    if (myComment) setText(myComment.comment)
    setError('')
    setSuccess('')
    setEditing(true)
  }

  function cancelEdit() {
    if (myComment) setText(myComment.comment)
    setEditing(false)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) { setError('Escribí un comentario'); return }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await createWineComment(user.id, slug, text)
      setSuccess(editing ? '¡Comentario actualizado!' : '¡Comentario publicado!')
      setEditing(false)
      await fetchComments()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteWineComment(id, user.id)
      setText('')
      await fetchComments()
    } catch {}
  }

  return (
    <section className="wineCommentsSection">
      <h2 className="wineCommentsTitle">
        Comentarios
        <span className="wineCommentsCount">{comments.length}</span>
      </h2>

      {/* ── lista de comentarios ── */}
      {loading ? (
        <p className="wineCommentsMuted">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="wineCommentsMuted">Todavía no hay comentarios. ¡Sé el primero!</p>
      ) : (
        <ul className="wineCommentsList">
          {comments.map(c => (
            <li key={c.id} className="wineCommentItem">
              <Avatar user={c} size={42} />
              <div className="wineCommentBody">
                <div className="wineCommentMeta">
                  <span className="wineCommentName">{c.user_name}</span>
                  <span className="wineCommentDate">
                    {new Date(c.created_at).toLocaleDateString('es-AR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                <p className="wineCommentText">{c.comment}</p>
              </div>
              {/* botón eliminar solo para el propio usuario */}
              {user && String(user.id) === String(c.user_id) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  title="Eliminar mi comentario"
                  className="wineCommentDelete"
                >×</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── formulario ── */}
      <div className="wineCommentsForm">
        {user ? (
          <form onSubmit={handleSubmit} className="wineCommentsFormInner">
            {/* header del form */}
            <div className="wineCommentsFormHeader">
              <Avatar user={{ profile_picture: user.profile_picture, user_name: user.name }} size={44} />
              <div style={{ flex: 1 }}>
                <div className="wineCommentsFormName">{user.name}</div>
                <div className="wineCommentsFormSub">
                  {hasComment
                    ? editing ? 'Editando tu comentario...' : 'Tu comentario publicado'
                    : 'Dejá tu opinión sobre este vino'}
                </div>
              </div>
              {/* lápiz editar */}
              {hasComment && !editing && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="wineCommentsEditBtn"
                  title="Editar comentario"
                >
                  ✏️ <span>Editar</span>
                </button>
              )}
            </div>

            {/* aviso una sola opinión */}
            {!hasComment && (
              <div className="wineCommentsNotice">
                💬 Solo se permite <strong>un comentario por usuario</strong>.
                Debe ser respetuoso. Comentarios ofensivos serán eliminados.
              </div>
            )}

            {/* textarea */}
            <textarea
              className="wineCommentsTextarea"
              placeholder="¿Qué te pareció este vino?"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={hasComment && !editing}
              style={{ opacity: hasComment && !editing ? 0.55 : 1 }}
              required
            />

            {error   && <p className="wineCommentsError">{error}</p>}
            {success && <p className="wineCommentsSuccess">{success}</p>}

            {/* botones */}
            <div className="wineCommentsActions">
              {hasComment ? (
                editing ? (
                  <>
                    <button type="button" className="btn" onClick={cancelEdit}
                      style={{ fontSize: 13 }}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btnPrimary" disabled={submitting}>
                      {submitting ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btnPrimary" disabled
                    style={{ opacity: 0.45, cursor: 'not-allowed', fontSize: 13 }}>
                    Comentario publicado
                  </button>
                )
              ) : (
                <button type="submit" className="btn btnPrimary" disabled={submitting}
                  style={{ alignSelf: 'flex-end' }}>
                  {submitting ? 'Publicando...' : 'Publicar comentario'}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="wineCommentsLogin">
            <span style={{ fontSize: 30 }}>🔐</span>
            <p>Iniciá sesión para dejar un comentario sobre este vino.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" className="btn btnPrimary">Iniciar sesión</Link>
              <Link to="/registro" className="btn">Registrate</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
