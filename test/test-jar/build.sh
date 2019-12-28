#/usr/bin/sh

# Clear previous JAR files
rm *.jar
rm jar0-contents/WEB-INF/lib/*

cd jar1-contents
zip -r ../jar0-contents/WEB-INF/lib/jar1.jar *
cd ../jar0-contents
zip -r ../jar0.jar *
cd ..
