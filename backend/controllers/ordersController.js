import sql from '../config/db.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import https from 'https';
import mercadopago from 'mercadopago';
import { Preference } from 'mercadopago';
import { Payment } from 'mercadopago';
dotenv.config();

// Configurar Mercado Pago con la nueva API
const mpClient = new mercadopago.MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.MAIL_HOST,
    port: 587,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    tls: {
        // El antivirus/proxy del equipo intercepta SSL y reemplaza certificados.
        // En producción con un servidor real esto no es necesario.
        rejectUnauthorized: false
    }
});

// Verificar conexión SMTP al iniciar
transporter.verify((error) => {
    if (error) {
        console.error('❌ Error en configuración SMTP:', error.message);
        console.error('   → Revisá MAIL_USER y MAIL_PASS en el .env (debe ser contraseña de aplicación de Gmail)');
    }
});

// POST /orders
export const createOrder = async (req, res) => {
    try {
        const {
            user_id, full_name, email, phone,
            address, city, province, postal_code, notes,
            payment_method, subtotal, shipping_cost, total, items
        } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ mensaje: 'Nombre y email son requeridos' });
        }

        // Generar código de pago único de 4 dígitos
        let paymentCode;
        let codeExists = true;
        const tempConnection = await sql();
        while (codeExists) {
            paymentCode = Math.floor(1000 + Math.random() * 9000).toString();
            const [rows] = await tempConnection.query('SELECT id FROM orders WHERE payment_code = ?', [paymentCode]);
            codeExists = rows.length > 0;
        }
        await tempConnection.end();

        const connection = await sql();

        // Crear preferencia de Mercado Pago (API de Preferences)
        let mpPreferenceId = null;
        let mpInitPoint = null;

        if (payment_method === 'mercadopago') {
            try {
                const preference = new Preference(mpClient);
                const preferenceData = {
                    items: items.map(item => ({
                        title: item.wineName,
                        quantity: item.quantity,
                        currency_id: 'ARS',
                        unit_price: item.price
                    })),
                    external_reference: paymentCode,
                    back_urls: {
                        success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/carrito?payment=success`,
                        failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/carrito?payment=failure`,
                        pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/carrito?payment=pending`
                    },
                    auto_return: 'approved',
                    notification_url: `${process.env.API_URL || 'http://localhost:3000'}/orders/mercadopago/webhook`
                };

                const response = await preference.create({ body: preferenceData });
                mpPreferenceId = response.id;
                mpInitPoint = response.init_point;
            } catch (mpError) {
                console.error('❌ Error al crear preferencia de Mercado Pago:', mpError.message);
                if (mpError.cause) console.error('   Causa:', JSON.stringify(mpError.cause));
            }
        }

        const [result] = await connection.query(
            `INSERT INTO orders
             (user_id, full_name, email, phone, address, city, province, postal_code,
              notes, payment_method, payment_code, mp_preference_id, subtotal, shipping_cost, total, items, status,
              pedido_realizado, pago_confirmado, pedido_empaquetado, pedido_enviado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_proceso', TRUE, FALSE, FALSE, FALSE)`,
            [
                user_id || null, full_name, email, phone || null,
                address || null, city || null, province || null, postal_code || null,
                notes || null, payment_method || 'mercadopago', paymentCode, mpPreferenceId,
                subtotal || 0, 0, subtotal || 0,
                JSON.stringify(items || [])
            ]
        );

        const orderId = result.insertId;

        // Enviar email de confirmación del pedido
        try {
            const itemsHtml = items.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; color: #333;">${item.wineName}</td>
                    <td style="padding: 12px; text-align: center; color: #666;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: right; color: #333; font-weight: 600;">${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(item.price * item.quantity)}</td>
                </tr>
            `).join('');

            await transporter.sendMail({
                from: `"RK Vinos" <${process.env.MAIL_USER}>`,
                to: email,
                subject: `Confirmación de tu pedido #${orderId} - RK Vinos`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #fff; border-radius: 12px;">
                        <div style="text-align: center; margin-bottom: 28px;">
                            <h1 style="color: #5a1f3f; font-size: 26px; margin: 0;">🍷 RK Vinos</h1>
                        </div>
                        <h2 style="color: #333; font-size: 20px; margin: 0 0 16px;">¡Pedido Confirmado!</h2>
                        <p style="font-size: 16px; color: #333;">Hola, <strong>${full_name}</strong>.</p>
                        <p style="font-size: 15px; color: #555; line-height: 1.6;">
                            Tu pedido <strong>#${orderId}</strong> ha sido registrado exitosamente. A continuación encontrarás el detalle y el seguimiento de tu pedido.
                        </p>

                        <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2196f3;">
                            <p style="margin: 0; font-size: 14px; color: #1565c0;">
                                <strong>Código de pago:</strong> <span style="font-size: 18px; font-weight: 800;">${paymentCode}</span>
                            </p>
                        </div>

                        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                            <h3 style="margin: 0 0 16px; color: #333; font-size: 16px;">📦 Detalle del Pedido</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #5a1f3f; color: white;">
                                        <th style="padding: 12px; text-align: left;">Producto</th>
                                        <th style="padding: 12px; text-align: center;">Cantidad</th>
                                        <th style="padding: 12px; text-align: right;">Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                            <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #ddd;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: #666;">Subtotal:</span>
                                    <span style="font-weight: 600;">${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(subtotal)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: #666;">Envío:</span>
                                    <span style="font-weight: 600; color: #16a34a;">Envío gratis</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #5a1f3f;">
                                    <span>Total:</span>
                                    <span>${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(subtotal)}</span>
                                </div>
                            </div>
                        </div>

                        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                            <h3 style="margin: 0 0 16px; color: #2e7d32; font-size: 16px;">📋 Seguimiento del Pedido</h3>
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 24px; height: 24px; background: #4caf50; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">✓</div>
                                <span style="color: #333; font-weight: 600;">Pedido realizado</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 24px; height: 24px; background: #ddd; color: #666; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">○</div>
                                <span style="color: #666;">Pago confirmado</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 24px; height: 24px; background: #ddd; color: #666; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">○</div>
                                <span style="color: #666;">Pedido empaquetado</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 24px; height: 24px; background: #ddd; color: #666; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">○</div>
                                <span style="color: #666;">Pedido enviado</span>
                            </div>
                        </div>

                        <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ffc107;">
                            <p style="margin: 0; font-size: 14px; color: #856404;">
                                <strong>📞 ¿Necesitas ayuda?</strong><br>
                                Comunicate al <strong>3815293658</strong> para cualquier consulta sobre tu pedido.
                            </p>
                        </div>

                        <p style="margin-top: 28px; font-size: 12px; color: #aaa; text-align: center;">
                            RK Vinos · Gracias por tu compra
                        </p>
                    </div>
                `
            });
        } catch (mailErr) {
            console.error('Error al enviar email de confirmación:', mailErr.message);
        }

        await connection.end();

        res.status(201).json({
            id: orderId,
            paymentCode,
            mpInitPoint,
            mensaje: 'Pedido creado'
        });
    } catch (error) {
        console.error('Error en createOrder:', error);
        res.status(500).json({ mensaje: 'Error al crear pedido', error: error.message });
    }
};

// GET /orders  (admin)
export const getOrders = async (req, res) => {
    try {
        const connection = await sql();
        const [rows] = await connection.query(
            `SELECT id, user_id, full_name, email, phone, address, city, province,
                    postal_code, notes, payment_method,
                    COALESCE(payment_code, '') as payment_code,
                    COALESCE(mp_preference_id, '') as mp_preference_id,
                    COALESCE(mp_payment_id, '') as mp_payment_id,
                    subtotal, shipping_cost, total,
                    items, status, pedido_realizado, pago_confirmado, pago_confirmado_fecha,
                    pedido_empaquetado, pedido_enviado, created_at,
                    TIMESTAMPDIFF(SECOND, created_at, NOW()) AS seconds_elapsed
             FROM orders
             ORDER BY created_at DESC`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en getOrders:', error);
        res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
    }
};

// GET /orders/:id
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await sql();
        const [rows] = await connection.query(
            `SELECT *, TIMESTAMPDIFF(SECOND, created_at, NOW()) AS seconds_elapsed
             FROM orders WHERE id = ?`, [id]
        );
        if (!rows.length) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener pedido', error: error.message });
    }
};

// PUT /orders/:id/status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, motivo } = req.body;

        if (!['en_proceso', 'aprobado', 'rechazado'].includes(status)) {
            return res.status(400).json({ mensaje: 'Estado inválido' });
        }

        if (status === 'rechazado' && !motivo?.trim()) {
            return res.status(400).json({ mensaje: 'El motivo es requerido para rechazar un pedido' });
        }

        const connection = await sql();

        // Obtener datos del pedido para el email
        const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (!orders.length) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        const order = orders[0];

        // Actualizar estado
        await connection.query(
            'UPDATE orders SET status = ?, rejection_reason = ? WHERE id = ?',
            [status, status === 'rechazado' ? motivo.trim() : null, id]
        );

        // Enviar email al cliente si fue rechazado
        if (status === 'rechazado') {
            try {
                await transporter.sendMail({
                    from: `"RK Vinos" <${process.env.MAIL_USER}>`,
                    to: order.email,
                    subject: 'Información sobre tu pedido en RK Vinos',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #fff; border-radius: 12px;">
                            <div style="text-align: center; margin-bottom: 28px;">
                                <h1 style="color: #5a1f3f; font-size: 26px; margin: 0;">RK Vinos</h1>
                            </div>
                            <p style="font-size: 16px; color: #333;">Hola, <strong>${order.full_name}</strong>.</p>
                            <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                Queremos informarte con todo respeto que, lamentablemente, no pudimos procesar tu pedido <strong>#${order.id}</strong> en esta oportunidad.
                            </p>
                            <div style="background: #fef2f2; border-left: 4px solid #e74c3c; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; color: #b91c1c; font-weight: 600;">Motivo:</p>
                                <p style="margin: 6px 0 0; font-size: 14px; color: #555;">${motivo.trim()}</p>
                            </div>
                            <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                Si tenés alguna consulta o querés realizar un nuevo pedido, no dudes en contactarnos. Estamos a tu disposición para ayudarte.
                            </p>
                            <div style="text-align: center; margin-top: 28px;">
                                <a href="https://wa.me/5491140000000" style="background: #5a1f3f; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
                                    Contactar por WhatsApp
                                </a>
                            </div>
                            <p style="margin-top: 28px; font-size: 12px; color: #aaa; text-align: center;">
                                RK Vinos · Gracias por elegirnos
                            </p>
                        </div>
                    `
                });
            } catch (mailErr) {
                console.error('Error al enviar email de rechazo:', mailErr.message);
            }
        }

        res.status(200).json({ mensaje: 'Estado actualizado' });
    } catch (error) {
        console.error('Error en updateOrderStatus:', error);
        res.status(500).json({ mensaje: 'Error al actualizar estado', error: error.message });
    }
};

// PUT /orders/:id/checkpoint - Actualizar checkpoints del pedido
export const updateOrderCheckpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkpoint, value, emailOnly } = req.body;

        const validCheckpoints = ['pago_confirmado', 'pedido_empaquetado', 'pedido_enviado'];
        if (!validCheckpoints.includes(checkpoint)) {
            return res.status(400).json({ mensaje: 'Checkpoint inválido' });
        }

        const connection = await sql();
        const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (!orders.length) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        const order = orders[0];

        // Si no es solo email, actualizar el checkpoint en la DB
        if (!emailOnly) {
            let updateQuery = '';
            let updateParams = [];

            if (checkpoint === 'pago_confirmado') {
                updateQuery = 'UPDATE orders SET pago_confirmado = ?, pago_confirmado_fecha = ? WHERE id = ?';
                updateParams = [value, value ? new Date() : null, id];
            } else if (checkpoint === 'pedido_empaquetado') {
                updateQuery = 'UPDATE orders SET pedido_empaquetado = ? WHERE id = ?';
                updateParams = [value, id];
            } else if (checkpoint === 'pedido_enviado') {
                updateQuery = 'UPDATE orders SET pedido_enviado = ? WHERE id = ?';
                updateParams = [value, id];
            }
            await connection.query(updateQuery, updateParams);
        }

        // Enviar email al cliente SOLO si emailOnly es true (notificación manual)
        if (emailOnly) {
            let emailSubject = '';
            let emailMessage = '';

            if (checkpoint === 'pago_confirmado') {
                emailSubject = `¡Pago Aceptado! - Pedido #${order.id}`;
                emailMessage = `
                    <h2 style="color: #2e7d32; font-size: 20px; margin: 0 0 16px;">✅ ¡Pago Aceptado!</h2>
                    <p style="font-size: 16px; color: #333;">Hola, <strong>${order.full_name}</strong>.</p>
                    <p style="font-size: 15px; color: #555; line-height: 1.6;">
                        Te informamos que el pago de tu pedido <strong>#${order.id}</strong> ha sido aceptado exitosamente.
                    </p>
                    <p style="font-size: 15px; color: #555; line-height: 1.6;">
                        Tu pedido está siendo preparado para su envío. Te notificaremos cuando esté empaquetado y enviado.
                    </p>
                `;
            } else if (checkpoint === 'pedido_empaquetado') {
                emailSubject = `Pedido Empaquetado - Pedido #${order.id}`;
                emailMessage = `
                    <h2 style="color: #5a1f3f; font-size: 20px; margin: 0 0 16px;">📦 Pedido Empaquetado</h2>
                    <p style="font-size: 16px; color: #333;">Hola, <strong>${order.full_name}</strong>.</p>
                    <p style="font-size: 15px; color: #555; line-height: 1.6;">
                        Tu pedido <strong>#${order.id}</strong> ha sido empaquetado y está listo para ser enviado.
                    </p>
                    <p style="font-size: 15px; color: #555; line-height: 1.6;">
                        Te notificaremos en breve cuando salga del almacén.
                    </p>
                `;
            } else if (checkpoint === 'pedido_enviado') {
                emailSubject = `¡Pedido Enviado! - Pedido #${order.id}`;
                emailMessage = `
                    <h2 style="color: #009688; font-size: 20px; margin: 0 0 16px;">🚚 ¡Pedido Enviado!</h2>
                    <p style="font-size: 16px; color: #333;">Hola, <strong>${order.full_name}</strong>.</p>
                    <p style="font-size: 15px; color: #555; line-height: 1.6;">
                        ¡Buenas noticias! Tu pedido <strong>#${order.id}</strong> ha sido enviado y está en camino.
                    </p>
                    <p style="font-size: 15px; color: #555; line-height: 1.6;">
                        El tiempo de entrega estimado es de 2-5 días hábiles. Si tenés alguna consulta, comunicate al <strong>3815293658</strong>.
                    </p>
                `;
            }

            try {
                await transporter.sendMail({
                    from: `"RK Vinos" <${process.env.MAIL_USER}>`,
                    to: order.email,
                    subject: emailSubject,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #fff; border-radius: 12px;">
                            <div style="text-align: center; margin-bottom: 28px;">
                                <h1 style="color: #5a1f3f; font-size: 26px; margin: 0;">🍷 RK Vinos</h1>
                            </div>
                            ${emailMessage}
                                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                                    <h3 style="margin: 0 0 16px; color: #333; font-size: 16px;">📋 Seguimiento Actual del Pedido</h3>
                                                
                                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 12px;">
                                        <div style="width: 24px; height: 24px; background: #4caf50; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 14px; font-weight: bold;">✓</div>
                                        <span style="color: #333; font-weight: 600;">Pedido realizado</span>
                                    </div>
                                                
                                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 12px;">
                                        <div style="width: 24px; height: 24px; background: ${order.pago_confirmado ? '#4caf50' : '#ddd'}; color: ${order.pago_confirmado ? 'white' : '#666'}; border-radius: 50%; text-align: center; line-height: 24px; font-size: 14px;">${order.pago_confirmado ? '✓' : '○'}</div>
                                        <span style="color: ${order.pago_confirmado ? '#333' : '#666'}; font-weight: ${order.pago_confirmado ? '600' : '400'};">Pago confirmado ${order.pago_confirmado_fecha ? `(${new Date(order.pago_confirmado_fecha).toLocaleDateString('es-AR')})` : ''}</span>
                                    </div>
                                                
                                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 12px;">
                                        <div style="width: 24px; height: 24px; background: ${order.pedido_empaquetado ? '#4caf50' : '#ddd'}; color: ${order.pedido_empaquetado ? 'white' : '#666'}; border-radius: 50%; text-align: center; line-height: 24px; font-size: 14px;">${order.pedido_empaquetado ? '✓' : '○'}</div>
                                        <span style="color: ${order.pedido_empaquetado ? '#333' : '#666'}; font-weight: ${order.pedido_empaquetado ? '600' : '400'};">Pedido empaquetado</span>
                                    </div>
                                                
                                    <div style="display: flex; align-items: center; gap: 20px;">
                                        <div style="width: 24px; height: 24px; background: ${order.pedido_enviado ? '#4caf50' : '#ddd'}; color: ${order.pedido_enviado ? 'white' : '#666'}; border-radius: 50%; text-align: center; line-height: 24px; font-size: 14px;">${order.pedido_enviado ? '✓' : '○'}</div>
                                        <span style="color: ${order.pedido_enviado ? '#333' : '#666'}; font-weight: ${order.pedido_enviado ? '600' : '400'};">Pedido enviado</span>
                                    </div>
                                </div>
                            <p style="margin-top: 28px; font-size: 12px; color: #aaa; text-align: center;">
                                RK Vinos · Gracias por tu compra
                            </p>
                        </div>
                    `
                });
                //console.log(`📧 Email de notificación enviado a ${order.email} para checkpoint: ${checkpoint}`);
            } catch (mailErr) {
                console.error('Error al enviar email de notificación:', mailErr.message);
            }
        }

        res.status(200).json({ mensaje: 'Checkpoint actualizado' });
    } catch (error) {
        console.error('Error en updateOrderCheckpoint:', error);
        res.status(500).json({ mensaje: 'Error al actualizar checkpoint', error: error.message });
    }
};

// POST /orders/mercadopago/webhook - Webhook de Mercado Pago
export const mercadopagoWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data.id;

            // Obtener información del pago desde Mercado Pago
            const payment = new Payment(mpClient);
            const paymentData = await payment.get({ id: paymentId });
            const externalReference = paymentData.external_reference;

            if (paymentData.status === 'approved') {
                const connection = await sql();

                // Buscar el pedido por el código de pago
                const [orders] = await connection.query(
                    'SELECT * FROM orders WHERE payment_code = ?',
                    [externalReference]
                );

                if (orders.length > 0) {
                    const order = orders[0];

                    // Actualizar el estado del pago
                    await connection.query(
                        `UPDATE orders
                         SET mp_payment_id = ?, pago_confirmado = TRUE, pago_confirmado_fecha = ?, status = 'aprobado'
                         WHERE id = ?`,
                        [paymentId, new Date(), order.id]
                    );

                    // Enviar email de confirmación de pago
                    try {
                        await transporter.sendMail({
                            from: `"RK Vinos" <${process.env.MAIL_USER}>`,
                            to: order.email,
                            subject: `¡Pago Aceptado! - Pedido #${order.id}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #fff; border-radius: 12px;">
                                    <div style="text-align: center; margin-bottom: 28px;">
                                        <h1 style="color: #5a1f3f; font-size: 26px; margin: 0;">🍷 RK Vinos</h1>
                                    </div>
                                    <h2 style="color: #2e7d32; font-size: 20px; margin: 0 0 16px;">✅ ¡Pago Aceptado!</h2>
                                    <p style="font-size: 16px; color: #333;">Hola, <strong>${order.full_name}</strong>.</p>
                                    <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                        Te informamos que el pago de tu pedido <strong>#${order.id}</strong> ha sido aceptado exitosamente.
                                    </p>
                                    <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                        Tu pedido está siendo preparado para su envío. Te notificaremos cuando esté empaquetado y enviado.
                                    </p>
                                    <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2196f3;">
                                        <p style="margin: 0; font-size: 14px; color: #1565c0;">
                                            <strong>Código de pago:</strong> <span style="font-size: 18px; font-weight: 800;">${order.payment_code}</span>
                                        </p>
                                    </div>
                                    <p style="margin-top: 28px; font-size: 12px; color: #aaa; text-align: center;">
                                        RK Vinos · Gracias por tu compra
                                    </p>
                                </div>
                            `
                        });
                    } catch (mailErr) {
                        console.error('Error al enviar email de confirmación de pago:', mailErr.message);
                    }

                    await connection.end();
                }
            }
        }

        res.status(200).json({ mensaje: 'Webhook procesado' });
    } catch (error) {
        console.error('Error en mercadopagoWebhook:', error);
        res.status(500).json({ mensaje: 'Error al procesar webhook', error: error.message });
    }
};

// PUT /orders/:id/reject - Rechazar pedido con motivo
export const rejectOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ mensaje: 'El motivo del rechazo es requerido' });
        }

        const connection = await sql();

        // Obtener datos del pedido
        const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (!orders.length) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        const order = orders[0];

        // Actualizar estado del pedido
        await connection.query(
            'UPDATE orders SET status = ?, rejection_reason = ? WHERE id = ?',
            ['rechazado', reason, id]
        );

        // Enviar email de notificación de rechazo
        try {
            await transporter.sendMail({
                from: `"RK Vinos" <${process.env.MAIL_USER}>`,
                to: order.email,
                subject: `Pedido Rechazado - Pedido #${order.id}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #fff; border-radius: 12px;">
                        <div style="text-align: center; margin-bottom: 28px;">
                            <h1 style="color: #5a1f3f; font-size: 26px; margin: 0;">🍷 RK Vinos</h1>
                        </div>
                        <h2 style="color: #f44336; font-size: 20px; margin: 0 0 16px;">❌ Pedido Rechazado</h2>
                        <p style="font-size: 16px; color: #333;">Hola, <strong>${order.full_name}</strong>.</p>
                        <p style="font-size: 15px; color: #555; line-height: 1.6;">
                            Lamentamos informarte que tu pedido <strong>#${order.id}</strong> (código: ${order.payment_code || 'N/A'}) ha sido rechazado.
                        </p>
                        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f44336;">
                            <h3 style="margin: 0 0 12px; color: #c62828; font-size: 16px;">Motivo del rechazo:</h3>
                            <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">${reason}</p>
                        </div>
                        <p style="font-size: 15px; color: #555; line-height: 1.6;">
                            Si tenés alguna duda o necesitas más información, comunicate al <strong>3815293658</strong>.
                        </p>
                        <p style="margin-top: 28px; font-size: 12px; color: #aaa; text-align: center;">
                            RK Vinos · Disculpa las molestias
                        </p>
                    </div>
                `
            });
        } catch (mailErr) {
            console.error('Error al enviar email de rechazo:', mailErr.message);
        }

        await connection.end();
        res.status(200).json({ mensaje: 'Pedido rechazado' });
    } catch (error) {
        console.error('Error en rejectOrder:', error);
        res.status(500).json({ mensaje: 'Error al rechazar pedido', error: error.message });
    }
};

// DELETE /orders/:id - Eliminar pedido
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await sql();

        await connection.query('DELETE FROM orders WHERE id = ?', [id]);

        await connection.end();
        res.status(200).json({ mensaje: 'Pedido eliminado' });
    } catch (error) {
        console.error('Error en deleteOrder:', error);
        res.status(500).json({ mensaje: 'Error al eliminar pedido', error: error.message });
    }
};

// ─── Estadísticas ──────────────────────────────────────────────────────────

// GET /orders/stats  →  { topPurchased: [{wineId, wineName, wineType, winery, total}], topViewed: [{slug, wineName, views}] }
export const getOrderStats = async (req, res) => {
    try {
        const connection = await sql();

        // Más comprados: suma quantities de pedidos aprobados
        const [purchasedRows] = await connection.query(`
            SELECT
                item_data.wineId,
                item_data.wineName,
                item_data.wineType,
                item_data.winery,
                SUM(item_data.quantity) AS total
            FROM orders o
            JOIN JSON_TABLE(
                o.items,
                '$[*]' COLUMNS (
                    wineId   INT         PATH '$.wineId',
                    wineName VARCHAR(255) PATH '$.wineName',
                    wineType VARCHAR(50)  PATH '$.wineType',
                    winery   VARCHAR(255) PATH '$.winery',
                    quantity INT         PATH '$.quantity'
                )
            ) AS item_data
            WHERE o.status = 'aprobado'
            GROUP BY item_data.wineId, item_data.wineName, item_data.wineType, item_data.winery
            ORDER BY total DESC
            LIMIT 10
        `);

        // Más visitados: desde tabla wine_views
        const [viewedRows] = await connection.query(`
            SELECT slug, wine_name AS wineName, views
            FROM wine_views
            ORDER BY views DESC
            LIMIT 10
        `);

        res.status(200).json({ topPurchased: purchasedRows, topViewed: viewedRows });
    } catch (error) {
        console.error('Error en getOrderStats:', error);
        res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
    }
};

// POST /wine-views/:slug  →  registra o incrementa una visita
export const trackWineView = async (req, res) => {
    try {
        const { slug } = req.params;
        const { wine_name } = req.body;
        const connection = await sql();

        await connection.query(`
            INSERT INTO wine_views (slug, wine_name, views)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE views = views + 1, wine_name = VALUES(wine_name)
        `, [slug, wine_name || slug]);

        res.status(200).json({ mensaje: 'Visita registrada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar visita', error: error.message });
    }
};
