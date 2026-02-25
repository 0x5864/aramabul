import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

const String kStartUrl = String.fromEnvironment(
  'APP_START_URL',
  defaultValue: 'http://10.0.2.2:5500/index.html',
);

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
            });
          },
          onProgress: (value) {
            if (!mounted) return;
            setState(() {
              _progress = value;
            });
          },
          onWebResourceError: (error) {
            if (!mounted) return;
            setState(() {
              _lastError = error.description;
              _isLoading = false;
            });
          },
        ),
      )
      ..loadRequest(Uri.parse(kStartUrl));

    final platformController = _controller.platform;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      _controller.setBackgroundColor(Colors.white);
    }
    if (platformController is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(true);
      platformController.setMediaPlaybackRequiresUserGesture(false);
    }
  }

  Future<void> _reload() async {
    await _controller.reload();
  }

  @override
  Widget build(BuildContext context) {
    final showProgress = _isLoading && _progress < 100;

    return Scaffold(
      appBar: AppBar(
        title: const Text('arama bul'),
        actions: [
          IconButton(
            tooltip: 'Yenile',
            onPressed: _reload,
            icon: const Icon(Icons.refresh),
          ),
        ],
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
                                'Yerel geliştirme için bilgisayarda `python3 -m http.server 5500` çalışmalı.',
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
