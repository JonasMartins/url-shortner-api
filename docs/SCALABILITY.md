# Shorten URL API - ESCALABILIDADE


[HOME - README](../README.md)

Para adicionar escalabilidade ao projeto, podemos pensar em 2 cenários, 1 mais simples e outro mais complexo, 
ambos serviços disponibilizados pela AWS.


## 1. ALB e ASG

1. Criar um ASG - Auto Scaling Group, adicionar o número de instâncias desejadas e máximo.
2. Associar o CloudWatch com coletas de métricas e políticas de escalonamento.
3. Adicionar um ALB - Elastic Load Balancer, para balancear o tráfego.
4. RDS Read replica - permitiria maior poder no banco adicionando réplicas para leitura.

Ao analisar o target tracking das instâncias com métricas por exemplo uso de CPU, o ASG automaticamente
adiciona novas instâncias. O banco também cria replicas quando se vê sobrecarregado, o próprio RDS oferece 
essa possibilidade.

## 2. EKS

1. EKS para gerênciar a escalabilidade e balançeamento entre os pods.
2. ALB para possiblitar expor con segurança o cluster.

A pesar de ser apenas um serviço, é entendido que o Kubernetes é mais complexo que a primeira opção, mas 
o lado positivo é que pode ser usado por outros provedores não apenas a AWS como a primeira opção.