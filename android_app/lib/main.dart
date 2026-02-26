import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

const String kStartUrl = String.fromEnvironment(
  'APP_START_URL',
  defaultValue: '',
);
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
  bool _usesRemoteStartUrl = false;
  bool _didFallbackToBundled = false;
  bool _hasLoadedAtLeastOnce = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
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

            if (_usesRemoteStartUrl &&
                !_didFallbackToBundled &&
                error.isForMainFrame == true) {
              _didFallbackToBundled = true;
              _loadBundledPage();
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
      if (kStartUrl.trim().isNotEmpty) {
        _usesRemoteStartUrl = true;
        await _controller.loadRequest(Uri.parse(kStartUrl));
        return;
      }

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
    _usesRemoteStartUrl = false;
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
      appBar: AppBar(
        backgroundColor: const Color(0xFF2C3531),
        title: const Text(
          'arama bul',
          style: TextStyle(
            color: Color(0xFFFFCB9A),
            fontSize: 32,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
          ),
        ),
      ),
      body: Column(
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
    );
  }
}
