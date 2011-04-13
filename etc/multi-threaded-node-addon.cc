#include <v8.h>
#include <node.h>
#include <unistd.h>
#include <string.h>
#include <glob.h>
#include "audiolib.h"

using namespace v8;
using namespace node;

static Persistent<String> completed_symbol;

class AudioLibNode : EventEmitter {
public:
  ev_async* songcompleted_async_;
  static void Initialize(Handle<Object> target){
    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->InstanceTemplate()->SetInternalFieldCount(1);

    completed_symbol = NODE_PSYMBOL("completed");

    NODE_SET_PROTOTYPE_METHOD(t, "init", Setup);
    NODE_SET_PROTOTYPE_METHOD(t, "createStreamFile", CreateStreamFile);
    NODE_SET_PROTOTYPE_METHOD(t, "channelPlay", ChannelPlay);
    NODE_SET_PROTOTYPE_METHOD(t, "channelStop", ChannelStop);
    NODE_SET_PROTOTYPE_METHOD(t, "channelPause", ChannelPause);

    target->Set(String::NewSymbol("audiolib"), t->GetFunction());
  }

  static void SongComplete(EV_P_ ev_async *w, int revents){
    AudioLibNode *audioLib = static_cast<AudioLibNode*>(w->data);
    audioLib->Emit(completed_symbol, 0, NULL);
  }

protected:
  static Handle<Value> New(const Arguments& args){
    HandleScope scope;
    AudioLibNode* audioLib = new AudioLibNode();
    audioLib->songcompleted_async_->data = audioLib;
    ev_async_init(audioLib->songcompleted_async_, AudioLibNode::SongComplete);
    ev_async_start(EV_DEFAULT_UC_ audioLib->songcompleted_async_);
    ev_unref(EV_DEFAULT_UC);
    audioLib->Wrap(args.This());
    return args.This();
  }

  AudioLibNode(){
    songcompleted_async_ = new ev_async();
  }

  ~AudioLibNode(){
    ev_async_stop(EV_DEFAULT_UC_ songcompleted_async_);
    AudioLib_Free();
    AudioLib_PluginFree(0);
    delete songcompleted_async_;
  }

  static Handle<Value> Setup(const Arguments& args){
    HandleScope scope;
    AudioLibNode* hw = ObjectWrap::Unwrap<AudioLibNode>(args.This());
    AudioLib_Free();

    if (!AudioLib_Init(-1,44100,0,0,NULL))
      {
        Local<String> result = String::New("Didn't work");
        AudioLib_Free();
        return scope.Close(result);
      }
    Local<String> anotherResult = String::New("Did work");
    return scope.Close(anotherResult);
  }

  static void CALLBACK SyncStreamProc(HSYNC handle, DWORD channel, DWORD data, void* user){
    AudioLibNode *audioLib = static_cast<AudioLibNode*>(user);
    ev_async_send(EV_DEFAULT_UC_ audioLib->songcompleted_async_);        
  }

  static Handle<Value> CreateStreamFile(const Arguments& args){
    HandleScope scope;
    DWORD handle;
    Handle<Value> fileName = args[0];
    AudioLibNode *audioLib = ObjectWrap::Unwrap<AudioLibNode>(args.This());
	  
    if(handle=AudioLib_StreamCreateFile(FALSE,*String::Utf8Value(fileName),0,0,0)) {
      Handle<Value> result = Integer::New(handle);
      AudioLib_ChannelSetSync(handle, AudioLib_SYNC_END, (QWORD)MAKELONG(10,0), AudioLibNode::SyncStreamProc, audioLib);
      return scope.Close(result);
    }
    else {
      Handle<Value> badResult = Integer::New(AudioLib_ErrorGetCode());
      return scope.Close(badResult);
    }
  }

  static Handle<Value> ChannelPlay(const Arguments& args){
    HandleScope scope;
    Handle<Value> success = Boolean::New(AudioLib_ChannelPlay(args[0]->IntegerValue(),FALSE));
    return scope.Close(success);
  }

  static Handle<Value> ChannelPause(const Arguments& args){
    HandleScope scope;
    Handle<Value> success = Boolean::New(AudioLib_ChannelPause(args[0]->IntegerValue()));
    return scope.Close(success);
  }

  static Handle<Value> ChannelStop(const Arguments& args){
    HandleScope scope;
    Handle<Value> success = Boolean::New(AudioLib_ChannelStop(args[0]->IntegerValue()));
    return scope.Close(success);
  }
};

extern "C" void
init (Handle<Object> target)
{
  HandleScope scope;
  AudioLibNode::Initialize(target);
}
