
-- Migration: 20251029205557

-- Migration: 20251028190438

-- Migration: 20251028165610

-- Migration: 20251028160435

-- Migration: 20251024203450
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  specialties TEXT[],
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  schedule TEXT NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 20,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create class_enrollments junction table
CREATE TABLE public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (class_id, student_id)
);

-- Enable RLS on class_enrollments
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles RLS Policies
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Teachers RLS Policies
CREATE POLICY "Authenticated users can view teachers"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Students RLS Policies
CREATE POLICY "Authenticated users can view students"
  ON public.students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'instructor')
  );

-- Classes RLS Policies
CREATE POLICY "Authenticated users can view classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Class enrollments RLS Policies
CREATE POLICY "Authenticated users can view enrollments"
  ON public.class_enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can manage enrollments"
  ON public.class_enrollments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'instructor')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migration: 20251024203549
-- Create enum for user roles (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  specialties TEXT[],
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  schedule TEXT NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 20,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create class_enrollments junction table
CREATE TABLE IF NOT EXISTS public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (class_id, student_id)
);

-- Enable RLS on class_enrollments
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Admins and instructors can manage students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can view classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can view enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins and instructors can manage enrollments" ON public.class_enrollments;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles RLS Policies
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Teachers RLS Policies
CREATE POLICY "Authenticated users can view teachers"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Students RLS Policies
CREATE POLICY "Authenticated users can view students"
  ON public.students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'instructor')
  );

-- Classes RLS Policies
CREATE POLICY "Authenticated users can view classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Class enrollments RLS Policies
CREATE POLICY "Authenticated users can view enrollments"
  ON public.class_enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can manage enrollments"
  ON public.class_enrollments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'instructor')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and recreate triggers for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_teachers_updated_at ON public.teachers;
CREATE TRIGGER set_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_classes_updated_at ON public.classes;
CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migration: 20251024203606
-- Create enum for user roles (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  specialties TEXT[],
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  schedule TEXT NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 20,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create class_enrollments junction table
CREATE TABLE IF NOT EXISTS public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (class_id, student_id)
);

-- Enable RLS on class_enrollments
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Admins and instructors can manage students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can view classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can view enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins and instructors can manage enrollments" ON public.class_enrollments;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles RLS Policies
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Teachers RLS Policies
CREATE POLICY "Authenticated users can view teachers"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Students RLS Policies
CREATE POLICY "Authenticated users can view students"
  ON public.students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'instructor')
  );

-- Classes RLS Policies
CREATE POLICY "Authenticated users can view classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Class enrollments RLS Policies
CREATE POLICY "Authenticated users can view enrollments"
  ON public.class_enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can manage enrollments"
  ON public.class_enrollments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'instructor')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and recreate triggers for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_teachers_updated_at ON public.teachers;
CREATE TRIGGER set_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_classes_updated_at ON public.classes;
CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migration: 20251024203625
-- Create enum for user roles (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  specialties TEXT[],
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  schedule TEXT NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 20,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create class_enrollments junction table
CREATE TABLE IF NOT EXISTS public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (class_id, student_id)
);

-- Enable RLS on class_enrollments
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Admins and instructors can manage students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can view classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can view enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins and instructors can manage enrollments" ON public.class_enrollments;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles RLS Policies
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Teachers RLS Policies
CREATE POLICY "Authenticated users can view teachers"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Students RLS Policies
CREATE POLICY "Authenticated users can view students"
  ON public.students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'instructor')
  );

-- Classes RLS Policies
CREATE POLICY "Authenticated users can view classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Class enrollments RLS Policies
CREATE POLICY "Authenticated users can view enrollments"
  ON public.class_enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and instructors can manage enrollments"
  ON public.class_enrollments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'instructor')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and recreate triggers for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_teachers_updated_at ON public.teachers;
CREATE TRIGGER set_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_classes_updated_at ON public.classes;
CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migration: 20251028150408
-- Function to automatically assign admin role to the first user
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users in user_roles
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- If this is the first user, make them admin
  -- Otherwise, assign default 'user' role
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign roles on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Migration: 20251028150438
-- Fix search_path for handle_new_user_role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users in user_roles
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- If this is the first user, make them admin
  -- Otherwise, assign default 'user' role
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Migration: 20251028151520
-- Update RLS policies to allow all authenticated users to manage data
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins and instructors can manage students" ON public.students;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Admins and instructors can manage enrollments" ON public.class_enrollments;

-- Create new policies for teachers (all authenticated users)
CREATE POLICY "Authenticated users can manage teachers" 
ON public.teachers 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create new policies for students (all authenticated users)
CREATE POLICY "Authenticated users can manage students" 
ON public.students 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create new policies for classes (all authenticated users)
CREATE POLICY "Authenticated users can manage classes" 
ON public.classes 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create new policies for enrollments (all authenticated users)
CREATE POLICY "Authenticated users can manage enrollments" 
ON public.class_enrollments 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add monthly_fee column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 90.00 NOT NULL;


-- Migration: 20251028160826
-- Force types regeneration by adding a comment
COMMENT ON TABLE public.teachers IS 'Teachers in the martial arts school';
COMMENT ON TABLE public.students IS 'Students enrolled in the martial arts school';
COMMENT ON TABLE public.classes IS 'Martial arts classes';
COMMENT ON TABLE public.class_enrollments IS 'Student enrollments in classes';

-- Migration: 20251028160859
-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Migration: 20251028160937
-- Force types regeneration by adding a comment
COMMENT ON TABLE public.students IS 'Students table - stores student information';
COMMENT ON TABLE public.teachers IS 'Teachers table - stores teacher information';
COMMENT ON TABLE public.classes IS 'Classes table - stores class information';
COMMENT ON TABLE public.class_enrollments IS 'Class enrollments - links students to classes';

-- Migration: 20251028163938
-- Update RLS policies to check for admin or instructor roles

-- Drop existing policies for students table
DROP POLICY IF EXISTS "Authenticated users can manage students" ON public.students;

-- Create new policies for students table
CREATE POLICY "All authenticated users can view students"
ON public.students
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and instructors can manage students"
ON public.students
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'instructor'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'instructor'::app_role)
);

-- Drop existing policies for teachers table
DROP POLICY IF EXISTS "Authenticated users can manage teachers" ON public.teachers;

-- Create new policies for teachers table
CREATE POLICY "All authenticated users can view teachers"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and instructors can manage teachers"
ON public.teachers
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'instructor'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'instructor'::app_role)
);

-- Drop existing policies for classes table
DROP POLICY IF EXISTS "Authenticated users can manage classes" ON public.classes;

-- Create new policies for classes table
CREATE POLICY "All authenticated users can view classes"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and instructors can manage classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'instructor'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'instructor'::app_role)
);

-- Drop existing policies for class_enrollments table
DROP POLICY IF EXISTS "Authenticated users can manage enrollments" ON public.class_enrollments;

-- Create new policies for class_enrollments table
CREATE POLICY "All authenticated users can view enrollments"
ON public.class_enrollments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and instructors can manage enrollments"
ON public.class_enrollments
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'instructor'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'instructor'::app_role)
);

-- Migration: 20251028164203
-- Create a function to get user profiles with emails (admin only)
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  -- Return profiles with emails from auth.users
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(u.email, 'N/A') as email,
    p.full_name
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.full_name;
END;
$$;


-- Migration: 20251028165937
-- Drop existing policies that are too permissive for instructors
DROP POLICY IF EXISTS "Admins and instructors can manage enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins and instructors can manage classes" ON public.classes;

-- Recreate classes policies with proper instructor restrictions
CREATE POLICY "Admins can manage all classes"
ON public.classes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can manage their own classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND teacher_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role)
  AND teacher_id = auth.uid()
);

-- Recreate enrollments policies with proper instructor restrictions
CREATE POLICY "Admins can manage all enrollments"
ON public.class_enrollments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can manage enrollments in their classes"
ON public.class_enrollments
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = class_enrollments.class_id
    AND classes.teacher_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = class_enrollments.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- Update students policies to allow instructors to view all students
-- (they need to see students to enroll them in their classes)
DROP POLICY IF EXISTS "Admins and instructors can manage students" ON public.students;

CREATE POLICY "Admins can manage all students"
ON public.students
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'instructor'::app_role));

-- Add index to improve performance of teacher_id lookups
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);

-- Migration: 20251028170339
-- Fix the get_users_with_emails function to handle type mismatch
DROP FUNCTION IF EXISTS public.get_users_with_emails();

CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE(id uuid, email text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  -- Return profiles with emails from auth.users (cast email to text)
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(u.email::text, 'N/A') as email,
    p.full_name
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.full_name;
END;
$$;

-- Migration: 20251028171029
-- Add user_id to students table to link auth users with students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

-- Create attendance table for check-ins
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins and instructors can view all attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'instructor'::app_role)
);

-- Update students RLS to allow users to view their own student record
CREATE POLICY "Users can view their own student record"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update their own student record (for initial setup)
CREATE POLICY "Users can update their own student record"
ON public.students
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update class_enrollments to allow students to enroll themselves
CREATE POLICY "Students can view their own enrollments"
ON public.class_enrollments
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can enroll themselves in classes"
ON public.class_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_checked_in ON public.attendance(checked_in_at);

-- Migration: 20251028172411
-- Allow users to create their own student profile
CREATE POLICY "Users can create their own student record"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Migration: 20251028174412
-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Migration: 20251028175834
-- Remove política que permite todos verem todas as turmas
DROP POLICY IF EXISTS "All authenticated users can view classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can view classes" ON public.classes;

-- Admins podem ver todas as turmas
CREATE POLICY "Admins can view all classes"
ON public.classes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Instrutores podem ver apenas suas próprias turmas
CREATE POLICY "Instructors can view their own classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND teacher_id = auth.uid()
);

-- Alunos (users) podem ver todas as turmas ativas para se matricular
CREATE POLICY "Students can view active classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  active = true 
  AND has_role(auth.uid(), 'user'::app_role)
);

-- Migration: 20251028182233
-- Drop existing policies for classes table
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Instructors can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Instructors can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view active classes" ON public.classes;

-- Create new simplified policies
-- Admins can do everything
CREATE POLICY "Admins have full access to all classes"
ON public.classes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Instructors can manage their own classes
CREATE POLICY "Instructors can manage their own classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND teacher_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND teacher_id = auth.uid()
);

-- Students can only view active classes
CREATE POLICY "Students can view active classes"
ON public.classes
FOR SELECT
TO authenticated
USING (
  active = true 
  AND has_role(auth.uid(), 'user'::app_role)
);

-- Migration: 20251028182526
-- Add user_id column to teachers table to link teachers with auth users
ALTER TABLE public.teachers 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_teachers_user_id ON public.teachers(user_id);

-- Migration: 20251028185543
-- Drop existing policies that allow instructors to view all data
DROP POLICY IF EXISTS "Instructors can view all students" ON public.students;
DROP POLICY IF EXISTS "Admins and instructors can view all attendance" ON public.attendance;

-- Create new policy: Instructors can only view students enrolled in their classes
CREATE POLICY "Instructors can view students in their classes"
ON public.students
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.classes c ON c.id = ce.class_id
    WHERE ce.student_id = students.id
    AND c.teacher_id = auth.uid()
  )
);

-- Create new policy: Instructors can only view attendance of students in their classes
CREATE POLICY "Instructors can view attendance in their classes"
ON public.attendance
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = attendance.class_id
    AND c.teacher_id = auth.uid()
  )
);

-- Admins still need full access, so add separate admin policies
CREATE POLICY "Admins can view all attendance"
ON public.attendance
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));


-- Migration: 20251028191115
-- Fix RLS policies for classes table to properly filter by instructor's teacher record

-- Drop existing instructor policy
DROP POLICY IF EXISTS "Instructors can manage their own classes" ON classes;

-- Recreate with correct logic linking auth.uid() -> teachers.user_id -> teachers.id -> classes.teacher_id
CREATE POLICY "Instructors can manage their own classes"
ON classes
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

-- Fix the class_enrollments policy for instructors as well
DROP POLICY IF EXISTS "Instructors can manage enrollments in their classes" ON class_enrollments;

CREATE POLICY "Instructors can manage enrollments in their classes"
ON class_enrollments
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND class_id IN (
    SELECT c.id 
    FROM classes c
    INNER JOIN teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND class_id IN (
    SELECT c.id 
    FROM classes c
    INNER JOIN teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Fix attendance policy for instructors
DROP POLICY IF EXISTS "Instructors can view attendance in their classes" ON attendance;

CREATE POLICY "Instructors can view attendance in their classes"
ON attendance
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND class_id IN (
    SELECT c.id 
    FROM classes c
    INNER JOIN teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Migration: 20251028201502
-- 1) Garantir relacionamentos (FKs) necessários para os relacionamentos aninhados funcionarem
-- Usamos DO blocks para evitar erro caso a constraint já exista
DO $$ BEGIN
  ALTER TABLE public.classes
    ADD CONSTRAINT classes_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.class_enrollments
    ADD CONSTRAINT class_enrollments_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.class_enrollments
    ADD CONSTRAINT class_enrollments_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.attendance
    ADD CONSTRAINT attendance_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.attendance
    ADD CONSTRAINT attendance_class_id_fkey
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Corrigir e endurecer RLS conforme hierarquia desejada
-- Alunos: manter políticas existentes de próprio registro, admins e update/insert, mas remover SELECT aberto
-- e corrigir a política de instrutores para checar via tabela teachers (user_id -> teacher.id)

-- Remover SELECTs abertos em students
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "All authenticated users can view students" ON public.students;

-- Corrigir política de instrutores em students
DROP POLICY IF EXISTS "Instructors can view students in their classes" ON public.students;
CREATE POLICY "Instructors can view students in their classes"
ON public.students
FOR SELECT
USING (
  public.has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.class_enrollments ce
    JOIN public.classes c ON c.id = ce.class_id
    JOIN public.teachers t ON t.id = c.teacher_id
    WHERE ce.student_id = students.id
      AND t.user_id = auth.uid()
  )
);

-- Em class_enrollments, remover SELECT aberto duplicado para restringir visibilidade
DROP POLICY IF EXISTS "Authenticated users can view enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "All authenticated users can view enrollments" ON public.class_enrollments;

-- Obs: Mantemos as políticas já existentes:
--  - Instructors can manage enrollments in their classes (ALL)
--  - Admins can manage all enrollments (ALL)
--  - Students can view their own enrollments (SELECT)
--  - Students can enroll themselves (INSERT)

-- As políticas de classes e attendance já estão corretas, mapeando teacher_id -> teachers.user_id
;

-- Migration: 20251028203724
-- Corrigir recursão infinita nas políticas de students
-- Criar função security definer que quebra a recursão

CREATE OR REPLACE FUNCTION public.can_view_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins podem ver todos
  SELECT 
    public.has_role(_user_id, 'admin'::app_role)
    OR
    -- Próprio aluno pode ver
    (SELECT user_id FROM public.students WHERE id = _student_id) = _user_id
    OR
    -- Instrutor pode ver se aluno está matriculado em suas turmas
    EXISTS (
      SELECT 1
      FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      JOIN public.teachers t ON t.id = c.teacher_id
      WHERE ce.student_id = _student_id
        AND t.user_id = _user_id
    )
$$;

-- Remover apenas as políticas SELECT problemáticas
DROP POLICY IF EXISTS "Instructors can view students in their classes" ON public.students;
DROP POLICY IF EXISTS "Users can view their own student record" ON public.students;

-- Criar política SELECT simplificada usando a função security definer
CREATE POLICY "Users can view students based on permissions"
ON public.students
FOR SELECT
USING (public.can_view_student(auth.uid(), id));

-- Migration: 20251028205247
-- Remove a política problemática que usa função recursiva
DROP POLICY IF EXISTS "Users can view students based on permissions" ON public.students;

-- Cria políticas mais diretas e eficientes para cada caso
CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own student record"
ON public.students
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Instructors can view students in their classes"
ON public.students
FOR SELECT
USING (
  public.has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.class_enrollments ce
    JOIN public.classes c ON c.id = ce.class_id
    JOIN public.teachers t ON t.id = c.teacher_id
    WHERE ce.student_id = students.id
      AND t.user_id = auth.uid()
  )
);

-- Migration: 20251028205454
-- Remove as políticas atuais de students
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Users can view their own student record" ON public.students;
DROP POLICY IF EXISTS "Instructors can view students in their classes" ON public.students;

-- Política para admins verem tudo
CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Política para usuários verem seu próprio registro
CREATE POLICY "Users can view their own student record"
ON public.students
FOR SELECT
USING (user_id = auth.uid());

-- Política simplificada: se você pode ver uma class_enrollment, pode ver o student básico
-- Isso permite queries aninhadas sem recursão
CREATE POLICY "Users can view students in accessible classes"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.class_enrollments ce
    WHERE ce.student_id = students.id
  )
);

-- Migration: 20251029193926
-- Remove a política problemática que verifica class_enrollments
DROP POLICY IF EXISTS "Users can view students in accessible classes" ON public.students;

-- Mantém as políticas que funcionam corretamente
-- (Admins can view all students e Users can view their own student record já existem);

-- Migration: 20251029194533
-- Adiciona campo de dia de vencimento da mensalidade
ALTER TABLE public.students 
ADD COLUMN payment_due_day integer CHECK (payment_due_day >= 1 AND payment_due_day <= 31);

COMMENT ON COLUMN public.students.payment_due_day IS 'Dia do mês para vencimento da mensalidade (1-31)';

-- Atualiza a política de UPDATE para permitir que alunos definam payment_due_day apenas uma vez
-- Admin pode alterar tudo, aluno só pode definir payment_due_day se ainda for NULL
DROP POLICY IF EXISTS "Users can update their own student record" ON public.students;

CREATE POLICY "Users can update their own student record"
ON public.students
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND (
    -- Aluno só pode definir payment_due_day se ainda for NULL
    (payment_due_day IS NULL OR payment_due_day = (SELECT payment_due_day FROM public.students WHERE id = students.id))
    -- Aluno não pode alterar monthly_fee
    AND monthly_fee = (SELECT monthly_fee FROM public.students WHERE id = students.id)
  )
);


-- Migration: 20251029210148
-- Limpar todos os dados das tabelas (mantendo a estrutura)
DELETE FROM public.attendance;
DELETE FROM public.class_enrollments;
DELETE FROM public.classes;
DELETE FROM public.students;
DELETE FROM public.teachers;
DELETE FROM public.user_roles WHERE role != 'admin' OR user_id NOT IN (SELECT id FROM auth.users LIMIT 1);
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users LIMIT 1);
