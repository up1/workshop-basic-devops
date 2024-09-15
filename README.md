# Workshop DevOps
* Working with Docker
* Working with Kubernetes
  * [Kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
  * [Kustomize](https://kustomize.io/)
* Pipeline with Jenkins

## 1. Working with Docker and Docker compose

### Build image
```
$docker compose build app
```

## Create container of PostgreSQL database
```
$docker compose up -d postgres
$docker compose ps            
NAME                  IMAGE         COMMAND                  SERVICE    CREATED          STATUS                            PORTS
pingpong-postgres-1   postgres:16   "docker-entrypoint.s…"   postgres   18 seconds ago   Up 4 seconds (health: starting)   5432/tcp
```

## Create container of App with NodeJS
```
$docker compose up -d app
$docker compose ps 
NAME                  IMAGE          COMMAND                  SERVICE    CREATED          STATUS                    PORTS
pingpong-app-1        pingpong-app   "docker-entrypoint.s…"   app        3 seconds ago    Up 2 seconds              3000/tcp, 0.0.0.0:5000->5000/tcp
pingpong-postgres-1   postgres:16    "docker-entrypoint.s…"   postgres   59 seconds ago   Up 44 seconds (healthy)   5432/tcp
```

Access from web browser
* http://localhost:5000
* http://localhost:5000/pingpong
* http://localhost:5000/healthz


## 2. Working with Kubernetes
* Kubectl
* Kustomize

### Create Kubernetes cluster with [minikube](https://minikube.sigs.k8s.io/docs/start/)
```
$minikube start 
$minikube status  
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured

$kubectl get node
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   8d    v1.30.0
```

Minikube addons
```
$minikube addons list
$minikube dashboard --url
🔌  Enabling dashboard ...
    ▪ Using image docker.io/kubernetesui/dashboard:v2.7.0
    ▪ Using image docker.io/kubernetesui/metrics-scraper:v1.0.8
💡  Some dashboard features require the metrics-server addon. To enable all features please run:

	minikube addons enable metrics-server

🤔  Verifying dashboard health ...
🚀  Launching proxy ...
🤔  Verifying proxy health ...
http://127.0.0.1:64482/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/
```

### Kubectl

Create database
```
$kubectl apply -f ./db

$kubectl get all
NAME                      READY   STATUS    RESTARTS   AGE
pod/pingpong-postgres-0   1/1     Running   0          38s

NAME                            TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
service/kubernetes              ClusterIP   10.96.0.1    <none>        443/TCP    8d
service/pingpong-postgres-svc   ClusterIP   None         <none>        5432/TCP   38s

NAME                                 READY   AGE
statefulset.apps/pingpong-postgres   1/1     38s
```

Create app
```
$kubectl apply -f ./app/manifests

$kubectl get all
NAME                                READY   STATUS    RESTARTS   AGE
pod/ping-pong-dep-7957f9bb8-cvq2k   1/1     Running   0          77s
pod/pingpong-postgres-0             1/1     Running   0          4m

NAME                            TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
service/kubernetes              ClusterIP   10.96.0.1     <none>        443/TCP        8d
service/ping-pong-svc           NodePort    10.99.82.11   <none>        80:30461/TCP   2m42s
service/pingpong-postgres-svc   ClusterIP   None          <none>        5432/TCP       4m

NAME                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/ping-pong-dep   1/1     1            1           2m42s

NAME                                       DESIRED   CURRENT   READY   AGE
replicaset.apps/ping-pong-dep-6f9bc4d77d   0         0         0       2m42s
replicaset.apps/ping-pong-dep-7957f9bb8    1         1         1       77s

NAME                                 READY   AGE
statefulset.apps/pingpong-postgres   1/1     4m
```

Access to app with service
```
$kubectl get svc         
NAME                    TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
kubernetes              ClusterIP   10.96.0.1     <none>        443/TCP        8d
ping-pong-svc           NodePort    10.99.82.11   <none>        80:30461/TCP   8m6s
pingpong-postgres-svc   ClusterIP   None          <none>        5432/TCP       9m24s

$minikube service ping-pong-svc --url
http://127.0.0.1:65400
❗  Because you are using a Docker driver on darwin, the terminal needs to be open to run it.
```

Working with [Ingress](https://kubernetes.io/docs/tasks/access-application-cluster/ingress-minikube/)
```
// Enable ingreess
$minikube addons enable ingress

// Check ingress-nginx
$kubectl get pods -n ingress-nginx
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-rnsth        0/1     Completed   0          98s
ingress-nginx-admission-patch-8jqqs         0/1     Completed   0          98s
ingress-nginx-controller-768f948f8f-gzp5b   1/1     Running     0          98s

// Create ingress
$kubectl apply -f ingress.yaml
$kubectl get ingress
kubectl get ingress              
NAME                CLASS   HOSTS   ADDRESS        PORTS   AGE
ping-pong-ingress   nginx   *       192.168.49.2   80      3m48s
```

Delete all resources
```
$kubectl delete -f ingress.yaml
$kubectl delete -f db/
$kubectl delete -f app/manifests
```

### Kustomize
```
// Deploy
$kubectl apply -k . 

// Get all resources
$kubectl get all

// Delete all
$kubectl delete -k . 
```
