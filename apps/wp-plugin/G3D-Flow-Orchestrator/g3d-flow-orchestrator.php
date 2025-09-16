<?php
/**
 * Plugin Name: G3D Flow Orchestrator
 * Description: UI Flow + Endpoints + Shortcode para el visor 3D.
 * Version: 3.4.0
 * Author: BLIND
 * License: MIT
 */

declare(strict_types=1);

namespace G3D\UIFlow;

defined('ABSPATH') || exit;

// === Opciones/constantes (evitar fatales) ===
if (!defined('G3D_FLOW_OPT_EMBEDS')) {
    define('G3D_FLOW_OPT_EMBEDS', 'g3dflow_embeds');
}
if (!defined('G3D_FLOW_SIG_OPTION')) {
    define('G3D_FLOW_SIG_OPTION', 'g3d_sig_key');
}

// === Init y Shortcode ===
\add_action('init', __NAMESPACE__ . '\init');
function init(): void
{
    \add_shortcode('g3d_viewer', __NAMESPACE__ . '\shortcode_viewer');
}

/**
 * Renderiza el shortcode del visor.
 *
 * @param array<string,string> $atts
 */
function shortcode_viewer(array $atts = []): string
{
    $a = \shortcode_atts(
        [
            'bridge_url' => \content_url('uploads/g3d/g3d-bridge.js'),
            'viewer_url' => \content_url('uploads/g3d/viewer/index.html'),
        ],
        $atts,
        'g3d_viewer'
    );

    \ob_start();
    ?>
    <div id="g3d-viewer" class="g3d-viewer">
        <iframe
            src="<?php echo \esc_url($a['viewer_url']); ?>"
            style="width:100%;aspect-ratio:16/9;border:0"
            title="G3D Viewer"
            loading="lazy">
        </iframe>
    </div>
    <script src="<?php echo \esc_url($a['bridge_url']); ?>" defer></script>
    <?php
    return \ob_get_clean() ?: '';
}

// === Admin mínimo (menú) ===
\add_action('admin_menu', __NAMESPACE__ . '\admin_menu');
function admin_menu(): void
{
    \add_menu_page(
        'G3D Flow',
        'G3D Flow',
        'manage_options',
        'g3d-flow',
        __NAMESPACE__ . '\render_admin',
        'dashicons-visibility',
        59
    );
}

function render_admin(): void
{
    $sig = (string) \get_option(G3D_FLOW_SIG_OPTION, 'dev-key');

    echo '<div class="wrap"><h1>G3D Flow — Ajustes</h1>';
    echo '<p>Clave de firma actual (placeholder): <code>' . \esc_html($sig) . '</code></p>';
    echo '<p>Configura Secrets en servidor/CI, no dejes la clave por defecto.</p>';
    echo '</div>';
}

// === REST API ===
\add_action('rest_api_init', __NAMESPACE__ . '\register_routes');
function register_routes(): void
{
    \register_rest_route('g3d/v1', '/validate-sign', [
        'methods'             => 'POST',
        'callback'            => __NAMESPACE__ . '\api_validate_sign',
        'permission_callback' => '__return_true',
    ]);

    \register_rest_route('g3d/v1', '/verify', [
        'methods'             => 'POST',
        'callback'            => __NAMESPACE__ . '\api_verify',
        'permission_callback' => '__return_true',
    ]);
}

/** @param \WP_REST_Request $request */
function api_validate_sign(\WP_REST_Request $request): \WP_REST_Response
{
    $data = (array) $request->get_json_params();
    $sku  = isset($data['sku']) ? (string) $data['sku'] : '';
    $hash = \hash('sha256', $sku);

    $ttl     = 3600; // 1h
    $expires = \time() + $ttl;
    $sigKey  = (string) \get_option(G3D_FLOW_SIG_OPTION, 'dev-key');

    $sigRaw    = \hash_hmac('sha256', $hash . '|' . $expires, $sigKey, true);
    $signature = 'sig.v1.' . \base64_encode($sigRaw);

    return new \WP_REST_Response(
        [
            'sku'        => $sku,
            'sku_hash'   => $hash,
            'signature'  => $signature,
            'expires_at' => \gmdate('c', $expires),
        ],
        200
    );
}

/** @param \WP_REST_Request $request */
function api_verify(\WP_REST_Request $request): \WP_REST_Response
{
    $data       = (array) $request->get_json_params();
    $hash       = isset($data['sku_hash']) ? (string) $data['sku_hash'] : '';
    $signature  = isset($data['signature']) ? (string) $data['signature'] : '';
    $expires_at = isset($data['expires_at']) ? (int) \strtotime((string) $data['expires_at']) : 0;
    $now        = \time();

    if ($hash === '' || $signature === '' || $expires_at <= $now) {
        return new \WP_REST_Response(['ok' => false, 'reason' => 'invalid_or_expired'], 400);
    }

    $sigKey  = (string) \get_option(G3D_FLOW_SIG_OPTION, 'dev-key');
    $payload = $hash . '|' . $expires_at;

    $parts     = \explode('.', $signature, 3);
    $provided  = isset($parts[2]) ? (string) \base64_decode($parts[2], true) : '';
    $calc      = \hash_hmac('sha256', $payload, $sigKey, true);
    $ok        = $provided !== '' && \hash_equals($calc, $provided);

    return new \WP_REST_Response(['ok' => $ok], $ok ? 200 : 400);
}
