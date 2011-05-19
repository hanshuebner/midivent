// -*- C++ -*-

// Simple mutex locking library similar to a tiny subset of Boost

#ifndef _mutex_h
#define _mutex_h

#include <pthread.h>

class pthread_exception
  : public std::exception
{
public:
  pthread_exception(const char* what)
    : _what(what)
  {}
  virtual const char* what() const throw() { return _what; }

private:
  const char* _what;
};

class mutex
{
public:
  mutex() {
    if (pthread_mutex_init(&_mutex, 0)) {
      throw pthread_exception("pthread_mutex_init failed");
    }
  }
  ~mutex() {
    if (pthread_mutex_destroy(&_mutex)) {
      throw pthread_exception("pthread_mutex_destroy failed");
    }
  }

  void lock() {
    if (pthread_mutex_lock(&_mutex)) {
      throw pthread_exception("pthread_mutex_lock failed");
    }
  }
  void unlock() {
    if (pthread_mutex_unlock(&_mutex)) {
      throw pthread_exception("pthread_mutex_unlock failed");
    }
  }

private:
  friend class condition_variable;
  pthread_mutex_t _mutex;
};

template <class T>
class unique_lock
{
public:
  unique_lock(T& lock)
    : _lock(&lock)
  {
    _lock->lock();
  }
  ~unique_lock()
  {
    _lock->unlock();
  }

private:
  friend class condition_variable;
  T* _lock;
};

class condition_variable
{
public:
  condition_variable() {
    pthread_cond_init(&_condition, 0);
  }
  ~condition_variable() {
    pthread_cond_destroy(&_condition);
  }

  void wait(unique_lock<mutex>& lock) {
    if (pthread_cond_wait(&_condition, &(lock._lock->_mutex))) {
      throw pthread_exception("pthread_cond_wait failed");
    }
  }
  void notify_one() {
    if (pthread_cond_signal(&_condition)) {
      throw pthread_exception("pthread_cond_signal failed");
    }
  }

public:
  pthread_cond_t _condition;
};

#endif
