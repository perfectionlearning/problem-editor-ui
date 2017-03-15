<?php

class com_wiris_plugin_impl_HttpImpl extends haxe_Http {
	public function __construct($url) {
		if(!isset($this->onError)) $this->onError = array(new _hx_lambda(array(&$this, &$url), "com_wiris_plugin_impl_HttpImpl_0"), 'execute');
		if(!isset($this->onData)) $this->onData = array(new _hx_lambda(array(&$this, &$url), "com_wiris_plugin_impl_HttpImpl_1"), 'execute');
		if(!php_Boot::$skip_constructor) {
		parent::__construct($url);
	}}
	public function setProxy($proxy) {
		haxe_Http::$PROXY = $proxy;
	}
	public function getData() {
		return $this->data;
	}
	public function onError($msg) { return call_user_func_array($this->onError, array($msg)); }
	public $onError = null;
	public function onData($data) { return call_user_func_array($this->onData, array($data)); }
	public $onData = null;
	public function request($post) {
		$proxy = haxe_Http::$PROXY;
		if($proxy !== null && $proxy->host !== null && strlen($proxy->host) > 0) {
			$hpa = $proxy->auth;
			if($hpa->user !== null && strlen($hpa->user) > 0) {
				$data = _hx_deref(new com_wiris_system_Base64())->encodeBytes(haxe_io_Bytes::ofString($hpa->user . ":" . $hpa->pass))->toString();
				$this->setHeader("Proxy-Authorization", "Basic " . $data);
			}
		}
		parent::request($post);
	}
	public $data;
	public function __call($m, $a) {
		if(isset($this->$m) && is_callable($this->$m))
			return call_user_func_array($this->$m, $a);
		else if(isset($this->»dynamics[$m]) && is_callable($this->»dynamics[$m]))
			return call_user_func_array($this->»dynamics[$m], $a);
		else if('toString' == $m)
			return $this->__toString();
		else
			throw new HException('Unable to call «'.$m.'»');
	}
	function __toString() { return 'com.wiris.plugin.impl.HttpImpl'; }
}
function com_wiris_plugin_impl_HttpImpl_0(&$»this, &$url, $msg) {
	{
		throw new HException($msg);
	}
}
function com_wiris_plugin_impl_HttpImpl_1(&$»this, &$url, $data) {
	{
		$»this->data = $data;
	}
}
