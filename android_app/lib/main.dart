import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

const String kBundledEntryAssetPath = 'assets/web/index.html';

void main() {
  runApp(const AramaBulApp());
}

class AramaBulApp extends StatelessWidget {
  const AramaBulApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'arama bul',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1F6F54)),
        scaffoldBackgroundColor: const Color(0xFFEAE7DC),
      ),
      home: const HomeWebViewPage(),
    );
  }
}

class HomeWebViewPage extends StatefulWidget {
  const HomeWebViewPage({super.key});

  @override
  State<HomeWebViewPage> createState() => _HomeWebViewPageState();
}

class _HomeWebViewPageState extends State<HomeWebViewPage> {
  late final WebViewController _controller;
  bool _isLoading = true;
  int _progress = 0;
  String? _lastError;
  bool _hasLoadedAtLeastOnce = false;

  bool _isMapLikeUrl(Uri uri, String rawUrl) {
    final scheme = uri.scheme.toLowerCase();
    final host = uri.host.toLowerCase();
    final path = uri.path.toLowerCase();
    final raw = rawUrl.toLowerCase();

    if (scheme == 'intent' || scheme == 'geo' || scheme == 'comgooglemaps') {
      return true;
    }

    if (host.contains('maps.google.') || host == 'maps.app.goo.gl') {
      return true;
    }

    if (host.contains('google.com') && path.startsWith('/maps')) {
      return true;
    }

    return raw.contains('google.com/maps') || raw.contains('maps.app.goo.gl');
  }

  Uri _resolveExternalUri(String rawUrl) {
    final raw = rawUrl.trim();

    if (raw.toLowerCase().startsWith('intent://')) {
      final intentPrefix = 'intent://';
      final intentIndex = raw.indexOf('#Intent;');
      final body = intentIndex >= 0 ? raw.substring(0, intentIndex) : raw;
      final meta = intentIndex >= 0 ? raw.substring(intentIndex) : '';
      final defaultHostPath = body.substring(intentPrefix.length);

      var scheme = 'https';
      final schemeMatch = RegExp(r';scheme=([^;]+);').firstMatch(meta);
      if (schemeMatch != null) {
        scheme = (schemeMatch.group(1) ?? 'https').trim();
      }

      return Uri.parse('$scheme://$defaultHostPath');
    }

    return Uri.parse(raw);
  }

  Future<NavigationDecision> _onNavigationRequest(
    NavigationRequest request,
  ) async {
    final rawUrl = request.url.trim();
    final parsed = Uri.tryParse(rawUrl);

    if (parsed == null) {
      return NavigationDecision.navigate;
    }

    final scheme = parsed.scheme.toLowerCase();
    final shouldOpenExternally = _isMapLikeUrl(parsed, rawUrl) ||
        (scheme != 'http' &&
            scheme != 'https' &&
            scheme != 'about' &&
            scheme != 'file' &&
            scheme != 'data' &&
            scheme != 'javascript');

    if (!shouldOpenExternally) {
      return NavigationDecision.navigate;
    }

    Uri externalUri;
    try {
      externalUri = _resolveExternalUri(rawUrl);
    } catch (error) {
      debugPrint('Dis URL cozumleme hatasi: $error');
      return NavigationDecision.prevent;
    }

    await launchUrl(externalUri, mode: LaunchMode.externalApplication);
    return NavigationDecision.prevent;
  }

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: _onNavigationRequest,
          onPageStarted: (_) {
            if (!mounted) return;
            setState(() {
              _isLoading = true;
              _lastError = null;
            });
          },
          onPageFinished: (_) {
            if (!mounted) return;
            setState(() {
              _isLoading = false;
              _lastError = null;
              _hasLoadedAtLeastOnce = true;
            });
          },
          onProgress: (value) {
            if (!mounted) return;
            setState(() {
              _progress = value;
            });
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame != true) {
              return;
            }

            if (_hasLoadedAtLeastOnce) {
              return;
            }

            if (!mounted) return;
            setState(() {
              _lastError = error.description;
              _isLoading = false;
            });
          },
        ),
      );

    final platformController = _controller.platform;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      _controller.setBackgroundColor(const Color(0xFFEAE7DC));
    }
    if (platformController is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(true);
      platformController.setMediaPlaybackRequiresUserGesture(false);
    }
    _loadInitialPage();
  }

  Future<void> _loadInitialPage() async {
    try {
      await _loadBundledPage();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _lastError = error.toString();
      });
    }
  }

  Future<void> _loadBundledPage() async {
    await _controller.clearCache();
    await _controller.loadFlutterAsset(kBundledEntryAssetPath);
  }

  Future<void> _reload() async {
    await _controller.reload();
  }

  @override
  Widget build(BuildContext context) {
    final showProgress = _isLoading && _progress < 100;

    return Scaffold(
      backgroundColor: const Color(0xFFEAE7DC),
      body: SafeArea(
        top: true,
        bottom: false,
        child: Column(
          children: [
            if (showProgress) LinearProgressIndicator(value: _progress / 100),
            Expanded(
              child: Stack(
                children: [
                  WebViewWidget(controller: _controller),
                  if (_lastError != null)
                    Align(
                      alignment: Alignment.center,
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'Sayfa yüklenemedi',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(_lastError!, textAlign: TextAlign.center),
                                const SizedBox(height: 14),
                                FilledButton(
                                  onPressed: _reload,
                                  child: const Text('Tekrar Dene'),
                                ),
                                const SizedBox(height: 10),
                                const Text(
                                  'Varsayılan olarak uygulama içindeki paketli web dosyası açılır.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
